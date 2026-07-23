export interface Edition {
  id: string;
  title: string;
  number: string;
  publishedAt: string;
  coverPageIndex: number;
  pageCount: number;
  pdfPath: string;
  pdfOriginalName: string;
  pdfSize: number;
  createdAt: string;
  coverImageUrl?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  url: string;
  whatsapp: string;
  address: string;
  imagePath: string;
  active: boolean;
  createdAt: string;
}

export type MuralStatus = "draft" | "published";

export interface MuralArtist {
  id: string;
  name: string;
  testimonial: string;
  artisticSegment: string;
  imagePath: string;
  imageUrl: string;
  imageAlt: string;
  order: number;
  status: MuralStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type EditionInput = Partial<Edition> & Pick<Edition, "id">;
type SponsorInput = Partial<Sponsor> & Pick<Sponsor, "id">;

const SESSION_KEY = "agralha-admin-token";
const pendingCoverImages = new Map<string, string>();

export async function getEditions(): Promise<Edition[]> {
  return api<Edition[]>("/api/content/editions");
}

export async function getEdition(id: string): Promise<Edition | undefined> {
  const response = await fetch(`/api/content/editions/${encodeURIComponent(id)}`);
  if (response.status === 404) return undefined;
  return readApiResponse<Edition>(response);
}

export async function saveEdition(edition: EditionInput) {
  const coverImageUrl = pendingCoverImages.get(edition.id) ?? edition.coverImageUrl;
  pendingCoverImages.delete(edition.id);
  return adminApi("/api/admin/editions", {
    method: "POST",
    body: JSON.stringify({
      coverPageIndex: 0,
      createdAt: new Date().toISOString(),
      ...edition,
      coverImageUrl,
    }),
  });
}

export async function updateEdition(edition: EditionInput) {
  const current = await getEdition(edition.id);
  return adminApi("/api/admin/editions", {
    method: "POST",
    body: JSON.stringify({ ...current, ...edition }),
  });
}

export async function deleteEdition(edition: Edition) {
  return adminApi("/api/admin/editions", {
    method: "DELETE",
    body: JSON.stringify({ id: edition.id }),
  });
}

export async function uploadEditionPdf(id: string, file: File): Promise<string> {
  return uploadFile("pdfs", file, id);
}

export async function uploadEditionCoverImage(id: string, file: File): Promise<string> {
  const path = await uploadFile("capas", file, id);
  pendingCoverImages.set(id, path);
  await adminApi("/api/admin/editions/cover", {
    method: "POST",
    body: JSON.stringify({ id, coverImageUrl: path }),
  }).catch(() => undefined);
  return path;
}

export function getEditionPdfUrl(pdfPath: string): string {
  if (/^https?:\/\//i.test(pdfPath)) {
    return `/api/pdf?url=${encodeURIComponent(pdfPath)}`;
  }

  return pdfPath;
}

export function getEditionCoverImagePath(id: string): string {
  return `${id}/cover`;
}

export function getEditionCoverImageUrl(editionOrId: Edition | string): string {
  if (typeof editionOrId !== "string") {
    return editionOrId.coverImageUrl || "/social-preview.png";
  }

  return pendingCoverImages.get(editionOrId) || "/social-preview.png";
}

export async function getSponsors(): Promise<Sponsor[]> {
  return api<Sponsor[]>("/api/content/sponsors");
}

export async function saveSponsor(sponsor: SponsorInput) {
  return adminApi("/api/admin/sponsors", {
    method: "POST",
    body: JSON.stringify({ createdAt: new Date().toISOString(), active: true, ...sponsor }),
  });
}

export async function updateSponsor(sponsor: SponsorInput) {
  return adminApi("/api/admin/sponsors", {
    method: "POST",
    body: JSON.stringify(sponsor),
  });
}

export async function deleteSponsor(sponsor: Sponsor) {
  return adminApi("/api/admin/sponsors", {
    method: "DELETE",
    body: JSON.stringify({ id: sponsor.id }),
  });
}

export async function uploadSponsorImage(id: string, file: File): Promise<string> {
  return uploadFile("patrocinadores", file, id);
}

export function getSponsorImageUrl(imagePath: string): string {
  return imagePath || "/social-preview.png";
}

export async function getMuralArtists(): Promise<MuralArtist[]> {
  return api<MuralArtist[]>("/api/content/mural-artists");
}

export async function getPublishedMuralArtists(): Promise<MuralArtist[]> {
  return api<MuralArtist[]>("/api/content/mural-artists/published");
}

export async function saveMuralArtist(artist: MuralArtist) {
  return adminApi("/api/admin/mural-artists", {
    method: "POST",
    body: JSON.stringify({ ...artist, imageUrl: artist.imagePath }),
  });
}

export async function updateMuralArtist(artist: MuralArtist) {
  return adminApi("/api/admin/mural-artists", {
    method: "POST",
    body: JSON.stringify({ ...artist, imageUrl: artist.imagePath }),
  });
}

export async function deleteMuralArtist(id: string) {
  return adminApi("/api/admin/mural-artists", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function uploadMuralArtistImage(file: File, artistName: string): Promise<string> {
  return uploadFile("mural", file, artistName);
}

export async function deleteMuralArtistImage(path: string): Promise<void> {
  await adminApi("/api/admin/upload", {
    method: "DELETE",
    body: JSON.stringify({ path }),
  });
}

export function getMuralArtistImageUrl(imagePath: string): string {
  return imagePath || "/social-preview.png";
}

export async function getAuthToken(): Promise<string> {
  return localStorage.getItem(SESSION_KEY) ?? "";
}

export async function signIn(email: string, password: string) {
  const result = await api<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(SESSION_KEY, result.token);
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export async function isAuthed(): Promise<boolean> {
  return Boolean(localStorage.getItem(SESSION_KEY));
}

export function onAuthChange(callback: (authed: boolean) => void) {
  const interval = window.setInterval(() => {
    callback(Boolean(localStorage.getItem(SESSION_KEY)));
  }, 1000);

  return () => window.clearInterval(interval);
}

export function uid() {
  return crypto.randomUUID();
}

async function uploadFile(kind: string, file: File, label: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", label);

  const response = await fetch(`/api/admin/upload?kind=${encodeURIComponent(kind)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getAuthToken()}` },
    body: formData,
  });
  const payload = await readApiResponse<{ path: string }>(response);
  return payload.path;
}

async function adminApi<T = { ok: true }>(input: string, init?: RequestInit) {
  return api<T>(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${await getAuthToken()}`,
      ...init?.headers,
    },
  });
}

async function api<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  return readApiResponse<T>(response);
}

async function readApiResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : undefined;

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === "string" ? payload.message : "Não foi possível concluir a ação.",
    );
  }

  return payload as T;
}
