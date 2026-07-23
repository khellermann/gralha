const ALLOWED_PDF_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "github-releases.githubusercontent.com",
]);

export async function handleExternalPdfProxy(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "Metodo nao permitido." }, 405);
  }

  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url") ?? "";
  const validation = validateExternalPdfUrl(target);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, 400);
  }

  try {
    const headers = new Headers({
      accept: "application/pdf,*/*",
      "user-agent": "A-Gralha-PDF-Proxy/1.0",
    });
    const range = request.headers.get("range");
    if (range) headers.set("range", range);

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return jsonResponse({ error: "Nao foi possivel carregar o PDF externo." }, upstream.status);
    }

    const responseHeaders = new Headers();
    responseHeaders.set("content-type", upstream.headers.get("content-type") ?? "application/pdf");
    responseHeaders.set("cache-control", "public, max-age=3600, s-maxage=86400");
    responseHeaders.set("accept-ranges", upstream.headers.get("accept-ranges") ?? "bytes");

    copyHeader(upstream.headers, responseHeaders, "content-length");
    copyHeader(upstream.headers, responseHeaders, "content-range");
    copyHeader(upstream.headers, responseHeaders, "last-modified");
    copyHeader(upstream.headers, responseHeaders, "etag");

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Unable to proxy external PDF", error);
    return jsonResponse({ error: "Nao foi possivel carregar o PDF externo." }, 502);
  }
}

function validateExternalPdfUrl(value: string): { ok: true } | { ok: false; error: string } {
  if (!value) return { ok: false, error: "Informe a URL do PDF." };

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return { ok: false, error: "Use uma URL HTTPS para o PDF." };
    }

    if (!ALLOWED_PDF_HOSTS.has(url.hostname)) {
      return { ok: false, error: "Use um PDF hospedado no GitHub." };
    }

    if (!url.pathname.toLowerCase().includes(".pdf")) {
      return { ok: false, error: "A URL precisa apontar para um arquivo PDF." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "URL de PDF invalida." };
  }
}

function copyHeader(source: Headers, target: Headers, name: string) {
  const value = source.get(name);
  if (value) target.set(name, value);
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
