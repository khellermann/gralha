import { createHmac, timingSafeEqual } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import editionsData from "@/data/editions.json";
import muralArtistsData from "@/data/mural-artistas.json";
import sponsorsData from "@/data/sponsors.json";
import type { Edition, MuralArtist, Sponsor } from "@/lib/store";

let pool: Pool | undefined;
let ready: Promise<void> | undefined;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurado no servidor.");
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}

export async function ensureDatabase() {
  if (!ready) {
    ready = migrateAndSeed();
  }

  await ready;
}

async function migrateAndSeed() {
  const db = getPool();

  await db.query(`
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

  await seedIfEmpty();
}

async function seedIfEmpty() {
  const db = getPool();
  const editionsCount = await db.query<{ count: string }>("SELECT COUNT(*) FROM editions");
  const sponsorsCount = await db.query<{ count: string }>("SELECT COUNT(*) FROM sponsors");
  const muralCount = await db.query<{ count: string }>("SELECT COUNT(*) FROM mural_artists");

  if (Number(editionsCount.rows[0]?.count ?? 0) === 0) {
    for (const edition of editionsData as Edition[]) {
      await upsertEdition(edition);
    }
  }

  if (Number(sponsorsCount.rows[0]?.count ?? 0) === 0) {
    for (const sponsor of sponsorsData as Sponsor[]) {
      await upsertSponsor(sponsor);
    }
  }

  if (Number(muralCount.rows[0]?.count ?? 0) === 0) {
    for (const artist of muralArtistsData as MuralArtist[]) {
      await upsertMuralArtist(artist);
    }
  }
}

export async function listEditions() {
  if (!hasDatabase()) {
    return [...(editionsData as Edition[])].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  await ensureDatabase();
  const result = await getPool().query(
    "SELECT * FROM editions ORDER BY published_at DESC, created_at DESC",
  );
  return result.rows.map(rowToEdition);
}

export async function findEdition(id: string) {
  if (!hasDatabase()) {
    return (editionsData as Edition[]).find((edition) => edition.id === id);
  }

  await ensureDatabase();
  const result = await getPool().query("SELECT * FROM editions WHERE id = $1", [id]);
  return result.rows[0] ? rowToEdition(result.rows[0]) : undefined;
}

export async function upsertEdition(edition: Edition) {
  await ensureDatabase();
  await getPool().query(
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
      cleanText(edition.id),
      cleanText(edition.title),
      cleanText(edition.number),
      edition.publishedAt,
      edition.coverPageIndex ?? 0,
      edition.pageCount ?? 0,
      cleanText(edition.pdfPath),
      cleanText(edition.pdfOriginalName),
      edition.pdfSize ?? 0,
      edition.createdAt ?? new Date().toISOString(),
      edition.coverImageUrl || null,
    ],
  );
}

export async function updateEditionCover(id: string, coverImageUrl: string) {
  await ensureDatabase();
  await getPool().query("UPDATE editions SET cover_image_url = $2 WHERE id = $1", [
    id,
    coverImageUrl,
  ]);
}

export async function removeEdition(id: string) {
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM editions WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] ? rowToEdition(result.rows[0]) : undefined;
}

export async function listSponsors() {
  if (!hasDatabase()) {
    return [...(sponsorsData as Sponsor[])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  await ensureDatabase();
  const result = await getPool().query("SELECT * FROM sponsors ORDER BY created_at ASC");
  return result.rows.map(rowToSponsor);
}

export async function upsertSponsor(sponsor: Sponsor) {
  await ensureDatabase();
  await getPool().query(
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
      cleanText(sponsor.id),
      cleanText(sponsor.name),
      cleanText(sponsor.url),
      cleanText(sponsor.whatsapp),
      cleanText(sponsor.address),
      cleanText(sponsor.imagePath),
      sponsor.active,
      sponsor.createdAt ?? new Date().toISOString(),
    ],
  );
}

export async function removeSponsor(id: string) {
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM sponsors WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] ? rowToSponsor(result.rows[0]) : undefined;
}

export async function listMuralArtists() {
  if (!hasDatabase()) {
    return [...(muralArtistsData as MuralArtist[])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  await ensureDatabase();
  const result = await getPool().query(
    "SELECT * FROM mural_artists ORDER BY display_order ASC, published_at DESC NULLS LAST, created_at DESC",
  );
  return result.rows.map(rowToMuralArtist);
}

export async function upsertMuralArtist(artist: MuralArtist) {
  await ensureDatabase();
  const publishedAt =
    artist.status === "published" ? artist.publishedAt || new Date().toISOString() : null;

  await getPool().query(
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
      cleanText(artist.id),
      cleanText(artist.name),
      cleanText(artist.testimonial),
      cleanText(artist.artisticSegment),
      cleanText(artist.imagePath),
      cleanText(artist.imagePath || artist.imageUrl),
      cleanText(artist.imageAlt),
      artist.order ?? 0,
      artist.status,
      artist.active,
      artist.createdAt ?? new Date().toISOString(),
      artist.updatedAt ?? new Date().toISOString(),
      publishedAt,
    ],
  );
}

export async function removeMuralArtist(id: string) {
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM mural_artists WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] ? rowToMuralArtist(result.rows[0]) : undefined;
}

export function createSession(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "editoraagralha@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("Configure ADMIN_PASSWORD no arquivo .env do servidor.");
  }

  if (
    email.trim().toLowerCase() !== adminEmail.trim().toLowerCase() ||
    password !== adminPassword
  ) {
    throw new Error("Credenciais inválidas.");
  }

  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  const payload = b64(JSON.stringify({ email: adminEmail, exp: expiresAt }));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function assertAdminRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!verifySession(token)) {
    throw Object.assign(new Error("Acesso não autorizado."), { status: 401 });
  }
}

function verifySession(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

function sign(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "agralha";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function b64(value: string) {
  return Buffer.from(value).toString("base64url");
}

function rowToEdition(row: QueryResultRow): Edition {
  return {
    id: row.id,
    title: row.title,
    number: row.number,
    publishedAt: new Date(row.published_at).toISOString(),
    coverPageIndex: row.cover_page_index,
    pageCount: row.page_count,
    pdfPath: row.pdf_path,
    pdfOriginalName: row.pdf_original_name,
    pdfSize: Number(row.pdf_size),
    createdAt: new Date(row.created_at).toISOString(),
    coverImageUrl: row.cover_image_url ?? undefined,
  };
}

function rowToSponsor(row: QueryResultRow): Sponsor {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    whatsapp: row.whatsapp,
    address: row.address,
    imagePath: row.image_path,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function rowToMuralArtist(row: QueryResultRow): MuralArtist {
  return {
    id: row.id,
    name: row.name,
    testimonial: row.testimonial,
    artisticSegment: row.artistic_segment,
    imagePath: row.image_path,
    imageUrl: row.image_url || row.image_path,
    imageAlt: row.image_alt,
    order: row.display_order,
    status: row.status,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
  };
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
