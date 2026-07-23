import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { getEditionCoverImageUrl } from "@/lib/store";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;

type CanvasRenderingContext = ReturnType<Canvas["getContext"]>;

export async function renderEditionPreviewResponse(editionId: string) {
  try {
    const coverResponse = await fetch(getEditionCoverImageUrl(editionId));

    if (!coverResponse.ok) {
      return pngResponse(await renderFallbackPreview());
    }

    return new Response(coverResponse.body, {
      headers: {
        "content-type": coverResponse.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error(`Unable to load edition cover preview for ${editionId}`, error);
    return pngResponse(await renderFallbackPreview());
  }
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

function pngResponse(body: Buffer) {
  return new Response(body as BodyInit, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}
