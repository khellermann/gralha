import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { findEdition } from "@/lib/server-database";
import { siteUrl } from "@/lib/seo";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;

export async function renderEditionPreviewResponse(editionId: string) {
  try {
    const edition = await findEdition(editionId);
    if (!edition) return pngResponse(await renderFallbackPreview());

    const cover = edition.coverImageUrl ? await loadImageBuffer(edition.coverImageUrl) : undefined;
    const body = cover
      ? await renderEditionPreview({
          cover,
          title: edition.title,
          number: edition.number,
        })
      : await renderFallbackPreview(edition.title);

    return pngResponse(body);
  } catch (error) {
    console.error(`Unable to render edition preview for ${editionId}`, error);
    return pngResponse(await renderFallbackPreview());
  }
}

async function renderEditionPreview({
  cover,
  title,
  number,
}: {
  cover: Buffer;
  title: string;
  number: string;
}) {
  const coverImage = await sharp(cover)
    .rotate()
    .resize({
      width: 390,
      height: 520,
      fit: "contain",
      background: "#f8f3e8",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const background = Buffer.from(`
    <svg width="${PREVIEW_WIDTH}" height="${PREVIEW_HEIGHT}" viewBox="0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#f4efe5"/>
      <path d="M0 64 H1200 M0 104 H1200 M0 144 H1200 M0 184 H1200 M0 224 H1200 M0 264 H1200 M0 304 H1200 M0 344 H1200 M0 384 H1200 M0 424 H1200 M0 464 H1200 M0 504 H1200 M0 544 H1200" stroke="#17345c" stroke-opacity="0.08" stroke-width="1"/>
      <rect x="0" y="0" width="24" height="630" fill="#17345c"/>
      <rect x="24" y="0" width="8" height="630" fill="#bf2f2f"/>
      <text x="92" y="96" fill="#17345c" font-family="Georgia, serif" font-size="28" font-weight="700" letter-spacing="4">JORNAL CULTURAL</text>
      <text x="92" y="188" fill="#17345c" font-family="Georgia, serif" font-size="86" font-weight="900">A Gralha</text>
      <rect x="96" y="222" width="420" height="8" fill="#bf2f2f"/>
      <text x="92" y="292" fill="#2f2a22" font-family="Georgia, serif" font-size="40" font-weight="700">${escapeSvg(shortTitle(title))}</text>
      <text x="92" y="348" fill="#4e473d" font-family="Arial, sans-serif" font-size="26">Edição ${escapeSvg(number)} disponível no acervo digital</text>
      <text x="92" y="520" fill="#17345c" font-family="Arial, sans-serif" font-size="24" font-weight="700">www.agralhacultural.com.br</text>
      <rect x="706" y="44" width="426" height="560" rx="6" fill="#ffffff"/>
      <rect x="706" y="44" width="426" height="560" rx="6" fill="none" stroke="#2f2a22" stroke-opacity="0.18" stroke-width="2"/>
    </svg>
  `);

  return sharp(background)
    .composite([
      {
        input: coverImage,
        left: 724,
        top: 64,
      },
    ])
    .png()
    .toBuffer();
}

async function renderFallbackPreview(title = "Jornal Cultural") {
  const background = Buffer.from(`
    <svg width="${PREVIEW_WIDTH}" height="${PREVIEW_HEIGHT}" viewBox="0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#f4efe5"/>
      <path d="M0 64 H1200 M0 104 H1200 M0 144 H1200 M0 184 H1200 M0 224 H1200 M0 264 H1200 M0 304 H1200 M0 344 H1200 M0 384 H1200 M0 424 H1200 M0 464 H1200 M0 504 H1200 M0 544 H1200" stroke="#17345c" stroke-opacity="0.08" stroke-width="1"/>
      <rect x="0" y="0" width="24" height="630" fill="#17345c"/>
      <rect x="24" y="0" width="8" height="630" fill="#bf2f2f"/>
      <text x="132" y="250" fill="#17345c" font-family="Georgia, serif" font-size="86" font-weight="900">A Gralha</text>
      <rect x="136" y="286" width="520" height="10" fill="#bf2f2f"/>
      <text x="136" y="356" fill="#3d4960" font-family="Georgia, serif" font-size="34">${escapeSvg(shortTitle(title))}</text>
      <text x="136" y="414" fill="#3d4960" font-family="Arial, sans-serif" font-size="26">Jornal cultural, literatura, arte e memória</text>
    </svg>
  `);

  return sharp(background).png().toBuffer();
}

async function loadImageBuffer(imagePath: string) {
  if (/^https?:\/\//i.test(imagePath)) {
    const response = await fetch(imagePath);
    if (!response.ok) return undefined;
    return Buffer.from(await response.arrayBuffer());
  }

  const relativePath = imagePath.replace(/^\/+/, "");
  const filePath = path.resolve(process.cwd(), "public", relativePath);

  if (!filePath.startsWith(path.resolve(process.cwd(), "public"))) {
    return undefined;
  }

  return readFile(filePath).catch(async () => {
    const response = await fetch(`${siteUrl}/${relativePath}`);
    if (!response.ok) return undefined;
    return Buffer.from(await response.arrayBuffer());
  });
}

function pngResponse(body: Buffer) {
  return new Response(body as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

function shortTitle(value: string) {
  return value.length > 38 ? `${value.slice(0, 35).trim()}...` : value;
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
