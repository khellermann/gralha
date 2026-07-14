import { createCanvas, DOMMatrix, ImageData, Path2D, type Canvas } from "@napi-rs/canvas";
import { getEdition, getEditionPdfUrl, type Edition } from "@/lib/store";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const COVER_RENDER_MAX_WIDTH = 900;
const COVER_RENDER_MAX_HEIGHT = 1100;
const COVER_DISPLAY_MAX_WIDTH = 500;
const COVER_DISPLAY_MAX_HEIGHT = 570;

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

  ensurePdfCanvasGlobals();
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
      COVER_RENDER_MAX_WIDTH / initialViewport.width,
      COVER_RENDER_MAX_HEIGHT / initialViewport.height,
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
  paintCoverBackground(ctx, coverCanvas);
  paintCover(ctx, coverCanvas);
  paintEditionText(ctx, edition);
  return canvas.encode("png");
}

async function renderFallbackPreview() {
  const canvas = createCanvas(PREVIEW_WIDTH, PREVIEW_HEIGHT);
  const ctx = canvas.getContext("2d");
  paintFallbackBackground(ctx);
  paintFallbackMark(ctx);

  ctx.fillStyle = "#17345c";
  ctx.font = "700 76px Georgia, serif";
  ctx.fillText("A Gralha", 132, 275);
  ctx.fillStyle = "#3d4960";
  ctx.font = "400 32px Georgia, serif";
  ctx.fillText("Jornal cultural, literatura, arte e memoria", 136, 338);

  return canvas.encode("png");
}

function ensurePdfCanvasGlobals() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
  };

  globalScope.DOMMatrix ??= DOMMatrix;
  globalScope.ImageData ??= ImageData;
  globalScope.Path2D ??= Path2D;
}

function paintFallbackBackground(ctx: CanvasRenderingContext) {
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

function paintFallbackMark(ctx: CanvasRenderingContext) {
  ctx.fillStyle = "#17345c";
  ctx.fillRect(132, 144, 290, 64);
  ctx.fillStyle = "#bf2f2f";
  ctx.fillRect(132, 226, 520, 10);
  ctx.fillStyle = "rgba(23, 52, 92, 0.18)";
  ctx.fillRect(136, 372, 650, 8);
  ctx.fillRect(136, 408, 580, 8);
  ctx.fillRect(136, 444, 450, 8);
}

function paintCoverBackground(ctx: CanvasRenderingContext, coverCanvas: Canvas) {
  const background = coverFillSize(coverCanvas.width, coverCanvas.height, PREVIEW_WIDTH, PREVIEW_HEIGHT);
  ctx.drawImage(
    coverCanvas,
    background.sourceX,
    background.sourceY,
    background.sourceWidth,
    background.sourceHeight,
    0,
    0,
    PREVIEW_WIDTH,
    PREVIEW_HEIGHT,
  );

  const wash = ctx.createLinearGradient(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
  wash.addColorStop(0, "rgba(8, 15, 27, 0.52)");
  wash.addColorStop(0.45, "rgba(244, 239, 229, 0.35)");
  wash.addColorStop(1, "rgba(8, 15, 27, 0.72)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  ctx.fillStyle = "rgba(244, 239, 229, 0.72)";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  ctx.fillStyle = "rgba(23, 52, 92, 0.08)";
  for (let y = 52; y < PREVIEW_HEIGHT; y += 30) {
    ctx.fillRect(0, y, PREVIEW_WIDTH, 1);
  }

  ctx.fillStyle = "#17345c";
  ctx.fillRect(0, 0, 18, PREVIEW_HEIGHT);
  ctx.fillStyle = "#bf2f2f";
  ctx.fillRect(18, 0, 8, PREVIEW_HEIGHT);
}

function paintCover(ctx: CanvasRenderingContext, coverCanvas: Canvas) {
  const fit = containSize(
    coverCanvas.width,
    coverCanvas.height,
    COVER_DISPLAY_MAX_WIDTH,
    COVER_DISPLAY_MAX_HEIGHT,
  );
  const x = 76 + (COVER_DISPLAY_MAX_WIDTH - fit.width) / 2;
  const y = (PREVIEW_HEIGHT - fit.height) / 2;

  ctx.fillStyle = "rgba(18, 28, 43, 0.28)";
  ctx.fillRect(x + 24, y + 24, fit.width, fit.height);

  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x - 16, y - 16, fit.width + 32, fit.height + 32);
  ctx.strokeStyle = "rgba(23, 52, 92, 0.18)";
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 16, y - 16, fit.width + 32, fit.height + 32);
  ctx.drawImage(coverCanvas, x, y, fit.width, fit.height);
}

function paintEditionText(ctx: CanvasRenderingContext, edition: Edition) {
  const dateLabel = new Date(edition.publishedAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const panelX = 650;

  ctx.fillStyle = "#bf2f2f";
  ctx.fillRect(panelX, 112, 92, 6);

  ctx.fillStyle = "#17345c";
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText(`Edição Nº ${edition.number}`, panelX, 162);

  ctx.fillStyle = "#172033";
  ctx.font = "700 58px Georgia, serif";
  wrapText(ctx, edition.title, panelX, 252, 455, 66, 3);

  ctx.fillStyle = "#3d4960";
  ctx.font = "400 30px Georgia, serif";
  ctx.fillText(dateLabel, panelX, 476);

  ctx.fillStyle = "#17345c";
  ctx.font = "700 42px Georgia, serif";
  ctx.fillText("A Gralha", panelX, 550);

  ctx.fillStyle = "#3d4960";
  ctx.font = "400 22px Arial, sans-serif";
  ctx.fillText("jornal cultural", panelX + 2, 582);
}

function containSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function coverFillSize(width: number, height: number, targetWidth: number, targetHeight: number) {
  const sourceRatio = width / height;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const sourceWidth = Math.round(height * targetRatio);
    return {
      sourceX: Math.round((width - sourceWidth) / 2),
      sourceY: 0,
      sourceWidth,
      sourceHeight: height,
    };
  }

  const sourceHeight = Math.round(width / targetRatio);
  return {
    sourceX: 0,
    sourceY: Math.round((height - sourceHeight) / 2),
    sourceWidth: width,
    sourceHeight,
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
