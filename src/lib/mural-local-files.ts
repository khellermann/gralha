import { createClient } from "@supabase/supabase-js";
import { MURAL_BUCKET, supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

type UploadResult = { ok: true; path: string } | { ok: false; status: number; message: string };

export async function handleMuralUpload(request: Request): Promise<Response> {
  const auth = await requireAuthenticatedEditor(request);
  if (!auth.ok) return jsonResponse({ error: auth.message }, auth.status);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_SIZE + 1024 * 1024) {
    return jsonResponse({ error: "Arquivo acima do limite de 8 MB." }, 413);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const artistName = sanitizeFilePart(String(formData.get("artistName") ?? "artista"));

    if (!(file instanceof File)) {
      return jsonResponse({ error: "Envie uma imagem." }, 400);
    }

    const result = await saveMuralImage(file, artistName, auth.token);
    if (!result.ok) return jsonResponse({ error: result.message }, result.status);

    return jsonResponse({ path: result.path }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: describeUploadError(error) }, 500);
  }
}

export async function handleMuralFileDelete(request: Request): Promise<Response> {
  const auth = await requireAuthenticatedEditor(request);
  if (!auth.ok) return jsonResponse({ error: auth.message }, auth.status);

  try {
    const body = (await request.json()) as { path?: unknown };
    const publicPath = typeof body.path === "string" ? body.path : "";

    if (!isAllowedMuralStoragePath(publicPath)) {
      return jsonResponse({ error: "Caminho de imagem inválido." }, 400);
    }

    const client = createAuthenticatedSupabaseClient(auth.token);
    const { error } = await client.storage.from(MURAL_BUCKET).remove([publicPath]);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Não foi possível remover a imagem." }, 500);
  }
}

async function saveMuralImage(
  file: File,
  artistName: string,
  token: string,
): Promise<UploadResult> {
  if (!isAllowedMime(file.type)) {
    return { ok: false, status: 400, message: "Use imagem JPEG, PNG ou WebP." };
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
    return { ok: false, status: 413, message: "Arquivo acima do limite de 8 MB." };
  }

  const originalName = file.name || "";
  if (!hasAllowedExtension(originalName)) {
    return { ok: false, status: 400, message: "Extensão de imagem inválida." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasAllowedMagic(bytes, file.type)) {
    return {
      ok: false,
      status: 400,
      message: "O conteúdo do arquivo não parece ser uma imagem válida.",
    };
  }

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const image = await loadImage(bytes);
  const ratio = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  const webp = await canvas.encode("webp", 82);
  const unique = crypto.randomUUID().slice(0, 6);
  const fileName = `${Date.now()}-${unique}-${artistName || "artista"}.webp`;
  const storagePath = `${unique}/${fileName}`;

  if (!isAllowedMuralStoragePath(storagePath)) {
    return { ok: false, status: 400, message: "Nome de arquivo inválido." };
  }

  const client = createAuthenticatedSupabaseClient(token);
  const { error } = await client.storage.from(MURAL_BUCKET).upload(storagePath, webp, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: false,
  });

  if (error) throw error;
  return { ok: true, path: storagePath };
}

function describeUploadError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("@napi-rs/canvas")) {
      return "Não foi possível carregar o processador de imagem no servidor atual.";
    }

    if (["EROFS", "EACCES", "EPERM"].some((code) => error.message.includes(code))) {
      return "O servidor não permitiu processar a imagem temporariamente.";
    }

    if (error.message.toLowerCase().includes("image")) {
      return "Não foi possível ler a imagem enviada. Tente JPG, PNG ou WebP válido.";
    }
  }

  return "Não foi possível processar a imagem.";
}

async function requireAuthenticatedEditor(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false as const, status: 401, message: "Acesso não autorizado." };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: "Sessão inválida ou expirada." };
  }

  return { ok: true as const, token };
}

function isAllowedMime(type: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

function hasAllowedExtension(name: string) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

function hasAllowedMagic(bytes: Buffer, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (type === "image/webp") {
    return (
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function sanitizeFilePart(value: string) {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned.slice(0, 60);
}

function isAllowedMuralStoragePath(storagePath: string) {
  if (!storagePath || storagePath.startsWith("/") || storagePath.includes("\0")) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\.webp$/.test(storagePath);
}

function createAuthenticatedSupabaseClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase não está configurado.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
