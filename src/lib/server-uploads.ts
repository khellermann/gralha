import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";

const IMAGE_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const PDF_MIME = new Map([["application/pdf", "pdf"]]);

const UPLOAD_KINDS = {
  pdfs: { folder: "pdfs", maxSize: 80 * 1024 * 1024, mimes: PDF_MIME },
  capas: { folder: "capas", maxSize: 25 * 1024 * 1024, mimes: IMAGE_MIME },
  patrocinadores: { folder: "patrocinadores", maxSize: 25 * 1024 * 1024, mimes: IMAGE_MIME },
  mural: { folder: "mural", maxSize: 25 * 1024 * 1024, mimes: IMAGE_MIME },
} as const;

type UploadKind = keyof typeof UPLOAD_KINDS;

export async function saveUploadedFile(request: Request, kind: string) {
  if (!isUploadKind(kind)) {
    throw Object.assign(new Error("Tipo de upload inválido."), { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const label = sanitizeSlug(String(formData.get("label") ?? "arquivo"));

  if (!(file instanceof File)) {
    throw Object.assign(new Error("Arquivo não enviado."), { status: 400 });
  }

  const config = UPLOAD_KINDS[kind];
  const extension = config.mimes.get(file.type);

  if (!extension) {
    throw Object.assign(new Error("Formato de arquivo não permitido."), { status: 400 });
  }

  if (file.size > config.maxSize) {
    throw Object.assign(new Error("Arquivo acima do limite permitido."), { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  validateFileSignature(bytes, extension);

  const folder = path.join(getUploadRoot(), config.folder);
  await mkdir(folder, { recursive: true });

  const isImage = IMAGE_MIME.has(file.type);
  const output = isImage ? await optimizeImage(bytes, kind) : bytes;
  const outputExtension = isImage ? "webp" : extension;
  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${label}.${outputExtension}`;
  const physicalPath = path.join(folder, fileName);

  assertInsideUploadRoot(physicalPath);
  await writeFile(physicalPath, output, { flag: "wx" });

  return `/uploads/${config.folder}/${fileName}`;
}

export async function deleteUploadedFile(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return;

  const physicalPath = resolveUploadPublicPath(publicPath);
  if (!physicalPath) return;

  await rm(physicalPath, { force: true });
}

export async function serveUploadedFile(request: Request, pathname: string) {
  const physicalPath = resolveUploadPublicPath(pathname);
  if (!physicalPath) {
    return new Response("Arquivo inválido.", { status: 400 });
  }

  try {
    const info = await stat(physicalPath);
    if (!info.isFile()) return new Response("Não encontrado.", { status: 404 });

    const headers = new Headers({
      "content-type": contentTypeFor(physicalPath),
      "content-length": String(info.size),
      "cache-control": "public, max-age=31536000, immutable",
    });

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }

    return new Response(Readable.toWeb(createReadStream(physicalPath)) as BodyInit, { headers });
  } catch {
    return new Response("Não encontrado.", { status: 404 });
  }
}

export function isLocalUploadPath(value: string) {
  return value.startsWith("/uploads/");
}

function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads"));
}

function resolveUploadPublicPath(publicPath: string) {
  if (!publicPath.startsWith("/uploads/") || publicPath.includes("\0")) return null;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const physicalPath = path.resolve(getUploadRoot(), relative);
  return isInside(physicalPath, getUploadRoot()) ? physicalPath : null;
}

function assertInsideUploadRoot(physicalPath: string) {
  if (!isInside(physicalPath, getUploadRoot())) {
    throw Object.assign(new Error("Caminho de arquivo inválido."), { status: 400 });
  }
}

function isInside(target: string, root: string) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isUploadKind(value: string): value is UploadKind {
  return value in UPLOAD_KINDS;
}

function sanitizeSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "arquivo"
  );
}

function validateFileSignature(bytes: Buffer, extension: string) {
  const signatures: Record<string, (input: Buffer) => boolean> = {
    pdf: (input) => input.subarray(0, 4).toString("ascii") === "%PDF",
    jpg: (input) => input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff,
    png: (input) =>
      input.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    webp: (input) =>
      input.subarray(0, 4).toString("ascii") === "RIFF" &&
      input.subarray(8, 12).toString("ascii") === "WEBP",
  };

  if (!signatures[extension]?.(bytes)) {
    throw Object.assign(new Error("O conteúdo do arquivo não corresponde ao formato informado."), {
      status: 400,
    });
  }
}

async function optimizeImage(bytes: Buffer, kind: UploadKind) {
  const limits = {
    capas: { width: 1600, height: 2200, quality: 82 },
    patrocinadores: { width: 1200, height: 700, quality: 84 },
    mural: { width: 1400, height: 1400, quality: 82 },
    pdfs: { width: 1600, height: 1600, quality: 82 },
  } satisfies Record<UploadKind, { width: number; height: number; quality: number }>;

  const limit = limits[kind];

  return sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({
      width: limit.width,
      height: limit.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: limit.quality, effort: 4 })
    .toBuffer();
}

function contentTypeFor(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}
