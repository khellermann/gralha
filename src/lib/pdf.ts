type PdfSource = File | string;

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  (
    pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }
  ).GlobalWorkerOptions.workerSrc = workerSrc;
  return pdfjs;
}

async function toDocumentData(source: PdfSource) {
  if (typeof source !== "string") return source.arrayBuffer();

  const response = await fetch(source);
  if (!response.ok) throw new Error("Não foi possível carregar o PDF.");
  return response.arrayBuffer();
}

export async function getPdfPageCount(source: PdfSource): Promise<number> {
  const pdfjs = await loadPdfJs();
  const data = await toDocumentData(source);
  const doc = await pdfjs.getDocument({ data }).promise;
  return doc.numPages;
}

export async function renderPdfPageToImage(
  source: PdfSource,
  pageNumber = 1,
  scale = 1.4,
): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = await toDocumentData(source);
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(Math.min(pageNumber, doc.numPages));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a renderização do PDF.");

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.86);
}

export async function renderPdfToImages(source: PdfSource, scale = 1.35): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const data = await toDocumentData(source);
  const doc = await pdfjs.getDocument({ data }).promise;
  const images: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a renderização do PDF.");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.86));
  }

  return images;
}
