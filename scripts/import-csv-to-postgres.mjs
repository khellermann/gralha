import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.split("=");
    return [key.replace(/^--/, ""), rest.join("=")];
  }),
);

const databaseUrl = process.env.DATABASE_URL;

const files = {
  editions: args.get("editions") || path.join(root, "imports", "editions_rows.csv"),
  sponsors: args.get("sponsors") || path.join(root, "imports", "sponsors_rows.csv"),
  mural: args.get("mural") || path.join(root, "imports", "mural_artistas_rows.csv"),
};

let pool;

try {
  const editions = await readCsvIfExists(files.editions);
  const sponsors = await readCsvIfExists(files.sponsors);
  const mural = await readCsvIfExists(files.mural);

  if (args.has("dry-run")) {
    console.log(
      `Leitura OK: ${editions.length} edicoes, ${sponsors.length} patrocinadores, ${mural.length} mural.`,
    );
    process.exit(0);
  }

  if (!databaseUrl) {
    console.error("Configure DATABASE_URL antes de rodar o importador.");
    process.exit(1);
  }

  pool = new Pool({ connectionString: databaseUrl });
  await migrate();

  for (const row of editions) {
    await pool.query(
      `
        INSERT INTO editions (
          id, title, number, published_at, cover_page_index, page_count,
          pdf_path, pdf_original_name, pdf_size, created_at, cover_image_url
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          number = EXCLUDED.number,
          published_at = EXCLUDED.published_at,
          cover_page_index = EXCLUDED.cover_page_index,
          page_count = EXCLUDED.page_count,
          pdf_path = EXCLUDED.pdf_path,
          pdf_original_name = EXCLUDED.pdf_original_name,
          pdf_size = EXCLUDED.pdf_size,
          cover_image_url = COALESCE(EXCLUDED.cover_image_url, editions.cover_image_url)
      `,
      [
        row.id,
        row.title,
        row.number,
        parseDate(row.published_at),
        toInt(row.cover_page_index, 0),
        toInt(row.page_count, 0),
        normalizeAssetPath(row.pdf_path, "pdfs"),
        row.pdf_original_name || "",
        toInt(row.pdf_size, 0),
        parseDate(row.created_at),
        normalizeOptionalAssetPath(row.cover_image_url, "capas"),
      ],
    );
  }

  for (const row of sponsors) {
    await pool.query(
      `
        INSERT INTO sponsors (id, name, url, whatsapp, address, image_path, active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          whatsapp = EXCLUDED.whatsapp,
          address = EXCLUDED.address,
          image_path = EXCLUDED.image_path,
          active = EXCLUDED.active
      `,
      [
        row.id,
        row.name,
        row.url || "",
        row.whatsapp || "",
        row.address || "",
        normalizeAssetPath(row.image_path, "patrocinadores"),
        toBool(row.active),
        parseDate(row.created_at),
      ],
    );
  }

  for (const row of mural) {
    const imagePath = normalizeAssetPath(row.imagem_url, "mural");
    await pool.query(
      `
        INSERT INTO mural_artists (
          id, name, testimonial, artistic_segment, image_path, image_url, image_alt,
          display_order, status, active, created_at, updated_at, published_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          testimonial = EXCLUDED.testimonial,
          artistic_segment = EXCLUDED.artistic_segment,
          image_path = EXCLUDED.image_path,
          image_url = EXCLUDED.image_url,
          image_alt = EXCLUDED.image_alt,
          display_order = EXCLUDED.display_order,
          status = EXCLUDED.status,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at,
          published_at = EXCLUDED.published_at
      `,
      [
        row.id,
        row.nome,
        row.depoimento,
        row.segmento_artistico || "",
        imagePath,
        imagePath,
        row.imagem_alt || `Foto de ${row.nome}`,
        toInt(row.ordem, 0),
        row.status === "published" ? "published" : "draft",
        toBool(row.ativo),
        parseDate(row.criado_em),
        parseDate(row.atualizado_em),
        row.publicado_em ? parseDate(row.publicado_em) : null,
      ],
    );
  }

  console.log(
    `Importacao concluida: ${editions.length} edicoes, ${sponsors.length} patrocinadores, ${mural.length} mural.`,
  );
} finally {
  await pool?.end();
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS editions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      number TEXT NOT NULL,
      published_at TIMESTAMPTZ NOT NULL,
      cover_page_index INTEGER NOT NULL DEFAULT 0,
      page_count INTEGER NOT NULL DEFAULT 0,
      pdf_path TEXT NOT NULL,
      pdf_original_name TEXT NOT NULL DEFAULT '',
      pdf_size BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      cover_image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      image_path TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mural_artists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      testimonial TEXT NOT NULL,
      artistic_segment TEXT NOT NULL DEFAULT '',
      image_path TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      image_alt TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ
    );
  `);
}

async function readCsvIfExists(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return parseCsv(content);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function parseCsv(content) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [header = [], ...data] = rows.filter((item) => item.some(Boolean));
  return data.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])),
  );
}

function normalizeAssetPath(value, folder) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith("/uploads/")) return cleaned;
  return `/uploads/${folder}/${cleaned.replace(/^\/+/, "")}`;
}

function normalizeOptionalAssetPath(value, folder) {
  return value ? normalizeAssetPath(value, folder) : null;
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value) {
  return String(value).trim().toLowerCase() === "true";
}
