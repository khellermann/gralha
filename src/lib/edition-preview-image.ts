import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { getEdition, getEditionPdfUrl, type Edition } from "@/lib/store";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const COVER_MAX_WIDTH = 430;
const COVER_MAX_HEIGHT = 520;

type CanvasRenderingContext = ReturnType<Canvas["getContext"]>;

export async function renderEditionPreviewResponse(editionId: string) {
  try {
    const edition = await getEdition(editionId);
    if (!edition) {
      return pngResponse(await renderFallbackPreview());
    }

    const coverCanvas = await renderPdfCoverCanvas(edition);
    return pngResponse(await composeEditionPreview(edition, coverCanvas));
  } catch (error) {
    console.error(`Unable to render edition preview image for ${editionId}`, error);
    return pngResponse(await renderFallbackPreview());
  }
}

async function renderPdfCoverCanvas(edition: Edition) {
  const pdfUrl = getEditionPdfUrl(edition.pdfPath);
  const pdfResponse = await fetch(pdfUrl);

  if (!pdfResponse.ok) {
    throw new Error(`Unable to download edition PDF: ${pdfResponse.status}`);
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfData = new Uint8Array(await pdfResponse.arrayBuffer());
  const documentTask = pdfjs.getDocument({
    data: pdfData,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const document = await documentTask.promise;

  try {
    const page = await document.getPage(edition.coverPageIndex + 1);
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      COVER_MAX_WIDTH / initialViewport.width,
      COVER_MAX_HEIGHT / initialViewport.height,
      2.4,
    );
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const canvasContext = canvas.getContext("2d");

    await page.render({
      canvas,
      canvasContext,
      viewport,
    }).promise;

    return canvas;
  } finally {
    await document.destroy();
  }
}

async function composeEditionPreview(edition: Edition, coverCanvas: Canvas) {
  const canvas = createCanvas(PREVIEW_WIDTH, PREVIEW_HEIGHT);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx);
  paintCover(ctx, coverCanvas);
  paintEditionText(ctx, edition);
  return canvas.encode("png");
}

async function renderFallbackPreview() {
  const canvas = createCanvas(PREVIEW_WIDTH, PREVIEW_HEIGHT);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx);

  ctx.fillStyle = "#17345c";
  ctx.font = "700 76px Georgia, serif";
  ctx.fillText("A Gralha", 132, 275);
  ctx.fillStyle = "#3d4960";
  ctx.font = "400 32px Georgia, serif";
  ctx.fillText("Jornal cultural, literatura, arte e memoria", 136, 338);

  return canvas.encode("png");
}

function paintBackground(ctx: CanvasRenderingContext) {
  ctx.fillStyle = "#f4efe5";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  ctx.fillStyle = "rgba(23, 52, 92, 0.08)";
  for (let y = 64; y < PREVIEW_HEIGHT; y += 34) {
    ctx.fillRect(0, y, PREVIEW_WIDTH, 1);
  }

  ctx.fillStyle = "#17345c";
  ctx.fillRect(0, 0, 18, PREVIEW_HEIGHT);
  ctx.fillStyle = "#bf2f2f";
  ctx.fillRect(18, 0, 8, PREVIEW_HEIGHT);
}

function paintCover(ctx: CanvasRenderingContext, coverCanvas: Canvas) {
  const fit = containSize(coverCanvas.width, coverCanvas.height, COVER_MAX_WIDTH, COVER_MAX_HEIGHT);
  const x = 116 + (COVER_MAX_WIDTH - fit.width) / 2;
  const y = 58 + (COVER_MAX_HEIGHT - fit.height) / 2;

  ctx.fillStyle = "rgba(18, 28, 43, 0.22)";
  ctx.fillRect(x + 18, y + 18, fit.width, fit.height);

  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x - 14, y - 14, fit.width + 28, fit.height + 28);
  ctx.strokeStyle = "rgba(23, 52, 92, 0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 14, y - 14, fit.width + 28, fit.height + 28);
  ctx.drawImage(coverCanvas, x, y, fit.width, fit.height);
}

function paintEditionText(ctx: CanvasRenderingContext, edition: Edition) {
  const dateLabel = new Date(edition.publishedAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  ctx.fillStyle = "#bf2f2f";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText(`EDICAO No ${edition.number}`, 620, 142);

  ctx.fillStyle = "#172033";
  ctx.font = "700 62px Georgia, serif";
  wrapText(ctx, edition.title, 620, 230, 470, 70, 3);

  ctx.fillStyle = "#3d4960";
  ctx.font = "400 30px Georgia, serif";
  ctx.fillText(dateLabel, 624, 448);

  ctx.fillStyle = "#17345c";
  ctx.font = "700 38px Georgia, serif";
  ctx.fillText("A Gralha", 624, 528);

  ctx.fillStyle = "#3d4960";
  ctx.font = "400 22px Arial, sans-serif";
  ctx.fillText("jornal cultural", 626, 562);
}

function containSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function wrapText(
  ctx: CanvasRenderingContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
      continue;
    }

    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.length > 0 && lines.length === maxLines) {
    const lastLine = lines[maxLines - 1];
    if (ctx.measureText(text).width > maxWidth * maxLines) {
      lines[maxLines - 1] = `${lastLine.replace(/\s+\S+$/, "")}...`;
    }
  }

  lines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
}

function pngResponse(body: Buffer) {
  return new Response(body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}
