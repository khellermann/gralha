import {
  assertAdminRequest,
  createSession,
  findEdition,
  listEditions,
  listMuralArtists,
  listSponsors,
  removeEdition,
  removeMuralArtist,
  removeSponsor,
  updateEditionCover,
  upsertEdition,
  upsertMuralArtist,
  upsertSponsor,
} from "@/lib/server-database";
import {
  deleteUploadedFile,
  isLocalUploadPath,
  saveUploadedFile,
  serveUploadedFile,
} from "@/lib/server-uploads";
import type { Edition, MuralArtist, Sponsor } from "@/lib/store";

export async function handleApiRequest(request: Request, url: URL): Promise<Response | undefined> {
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    url.pathname.startsWith("/uploads/")
  ) {
    return serveUploadedFile(request, url.pathname);
  }

  if (!url.pathname.startsWith("/api/")) return undefined;

  try {
    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      const payload = (await request.json()) as { email?: string; password?: string };
      return json({ token: createSession(payload.email ?? "", payload.password ?? "") });
    }

    if (url.pathname === "/api/content/editions" && request.method === "GET") {
      return json(await listEditions());
    }

    if (url.pathname.startsWith("/api/content/editions/") && request.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/content/editions/", ""));
      const edition = await findEdition(id);
      return edition ? json(edition) : json({ message: "Edição não encontrada." }, 404);
    }

    if (url.pathname === "/api/content/sponsors" && request.method === "GET") {
      return json(await listSponsors());
    }

    if (url.pathname === "/api/content/mural-artists" && request.method === "GET") {
      return json(await listMuralArtists());
    }

    if (url.pathname === "/api/content/mural-artists/published" && request.method === "GET") {
      const artists = await listMuralArtists();
      return json(artists.filter((artist) => artist.status === "published" && artist.active));
    }

    if (url.pathname === "/api/admin/upload" && request.method === "POST") {
      assertAdminRequest(request);
      return json({ path: await saveUploadedFile(request, url.searchParams.get("kind") ?? "") });
    }

    if (url.pathname === "/api/admin/upload" && request.method === "DELETE") {
      assertAdminRequest(request);
      const payload = (await request.json()) as { path?: string };
      await deleteUploadedFile(payload.path ?? "");
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/editions" && request.method === "POST") {
      assertAdminRequest(request);
      await upsertEdition((await request.json()) as Edition);
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/editions" && request.method === "DELETE") {
      assertAdminRequest(request);
      const payload = (await request.json()) as { id?: string };
      const deleted = payload.id ? await removeEdition(payload.id) : undefined;
      if (deleted) {
        await deleteUploadedFileIfLocal(deleted.pdfPath);
        await deleteUploadedFileIfLocal(deleted.coverImageUrl ?? "");
      }
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/editions/cover" && request.method === "POST") {
      assertAdminRequest(request);
      const payload = (await request.json()) as { id?: string; coverImageUrl?: string };
      if (!payload.id || !payload.coverImageUrl) return json({ message: "Dados inválidos." }, 400);
      await updateEditionCover(payload.id, payload.coverImageUrl);
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/sponsors" && request.method === "POST") {
      assertAdminRequest(request);
      await upsertSponsor((await request.json()) as Sponsor);
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/sponsors" && request.method === "DELETE") {
      assertAdminRequest(request);
      const payload = (await request.json()) as { id?: string };
      const deleted = payload.id ? await removeSponsor(payload.id) : undefined;
      if (deleted) await deleteUploadedFileIfLocal(deleted.imagePath);
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/mural-artists" && request.method === "POST") {
      assertAdminRequest(request);
      await upsertMuralArtist((await request.json()) as MuralArtist);
      return json({ ok: true });
    }

    if (url.pathname === "/api/admin/mural-artists" && request.method === "DELETE") {
      assertAdminRequest(request);
      const payload = (await request.json()) as { id?: string };
      const deleted = payload.id ? await removeMuralArtist(payload.id) : undefined;
      return json({ ok: true, deleted });
    }

    return json({ message: "Rota não encontrada." }, 404);
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    const message = error instanceof Error ? error.message : "Erro interno.";
    if (status >= 500) console.error(error);
    return json({ message }, status || 500);
  }
}

async function deleteUploadedFileIfLocal(path: string) {
  if (isLocalUploadPath(path)) {
    await deleteUploadedFile(path);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
