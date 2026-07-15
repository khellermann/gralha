import { EDITIONS_BUCKET, SPONSORS_BUCKET, supabase } from "@/lib/supabase";

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
  imageUrl: string;
  imageAlt: string;
  order: number;
  status: MuralStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type EditionRow = {
  id: string;
  title: string;
  number: string;
  published_at: string;
  cover_page_index: number;
  page_count: number;
  pdf_path: string;
  pdf_original_name: string;
  pdf_size: number;
  created_at: string;
};

type SponsorRow = {
  id: string;
  name: string;
  url: string | null;
  whatsapp: string | null;
  address: string | null;
  image_path: string;
  active: boolean;
  created_at: string;
};

type MuralArtistRow = {
  id: string;
  nome: string;
  depoimento: string;
  segmento_artistico: string | null;
  imagem_url: string;
  imagem_alt: string;
  ordem: number;
  status: MuralStatus;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  publicado_em: string | null;
};

function mapEdition(row: EditionRow): Edition {
  return {
    id: row.id,
    title: row.title,
    number: row.number,
    publishedAt: row.published_at,
    coverPageIndex: row.cover_page_index,
    pageCount: row.page_count,
    pdfPath: row.pdf_path,
    pdfOriginalName: row.pdf_original_name,
    pdfSize: row.pdf_size,
    createdAt: row.created_at,
  };
}

function mapSponsor(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? "",
    whatsapp: row.whatsapp ?? "",
    address: row.address ?? "",
    imagePath: row.image_path,
    active: row.active,
    createdAt: row.created_at,
  };
}

function mapMuralArtist(row: MuralArtistRow): MuralArtist {
  return {
    id: row.id,
    name: row.nome,
    testimonial: row.depoimento,
    artisticSegment: row.segmento_artistico ?? "",
    imageUrl: row.imagem_url,
    imageAlt: row.imagem_alt,
    order: row.ordem,
    status: row.status,
    active: row.ativo,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
    publishedAt: row.publicado_em,
  };
}

export async function getEditions(): Promise<Edition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapEdition(row as EditionRow));
}

export async function getEdition(id: string): Promise<Edition | undefined> {
  const { data, error } = await supabase.from("editions").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data ? mapEdition(data as EditionRow) : undefined;
}

export async function saveEdition(input: {
  id: string;
  title: string;
  number: string;
  publishedAt: string;
  pdfPath: string;
  pdfOriginalName: string;
  pdfSize: number;
  pageCount: number;
  coverPageIndex?: number;
}) {
  const { error } = await supabase.from("editions").insert({
    id: input.id,
    title: input.title,
    number: input.number,
    published_at: input.publishedAt,
    pdf_path: input.pdfPath,
    pdf_original_name: input.pdfOriginalName,
    pdf_size: input.pdfSize,
    page_count: input.pageCount,
    cover_page_index: input.coverPageIndex ?? 0,
  });

  if (error) throw error;
}

export async function updateEdition(input: {
  id: string;
  title: string;
  number: string;
  publishedAt: string;
}) {
  const { error } = await supabase
    .from("editions")
    .update({
      title: input.title,
      number: input.number,
      published_at: input.publishedAt,
    })
    .eq("id", input.id);

  if (error) throw error;
}

export async function deleteEdition(edition: Edition) {
  const { error } = await supabase.from("editions").delete().eq("id", edition.id);
  if (error) throw error;

  await supabase.storage
    .from(EDITIONS_BUCKET)
    .remove([edition.pdfPath, getEditionCoverImagePath(edition.id)]);
}

export async function uploadEditionPdf(id: string, file: File): Promise<string> {
  const path = `${id}/${Date.now()}-${slugFileName(file.name, "edicao.pdf")}`;
  const { error } = await supabase.storage.from(EDITIONS_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function uploadEditionCoverImage(id: string, file: File): Promise<string> {
  const path = getEditionCoverImagePath(id);
  const { error } = await supabase.storage.from(EDITIONS_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) throw error;
  return path;
}

export function getEditionPdfUrl(pdfPath: string): string {
  return supabase.storage.from(EDITIONS_BUCKET).getPublicUrl(pdfPath).data.publicUrl;
}

export function getEditionCoverImagePath(id: string): string {
  return `${id}/cover`;
}

export function getEditionCoverImageUrl(id: string): string {
  return supabase.storage.from(EDITIONS_BUCKET).getPublicUrl(getEditionCoverImagePath(id)).data
    .publicUrl;
}

export async function getSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapSponsor(row as SponsorRow));
}

export async function saveSponsor(input: {
  id: string;
  name: string;
  url: string;
  whatsapp: string;
  address: string;
  imagePath: string;
  active: boolean;
}) {
  const { error } = await supabase.from("sponsors").insert({
    id: input.id,
    name: input.name,
    url: input.url || null,
    whatsapp: input.whatsapp || null,
    address: input.address || null,
    image_path: input.imagePath,
    active: input.active,
  });

  if (error) throw error;
}

export async function updateSponsor(sponsor: Sponsor) {
  const { error } = await supabase
    .from("sponsors")
    .update({
      active: sponsor.active,
      name: sponsor.name,
      url: sponsor.url || null,
      whatsapp: sponsor.whatsapp || null,
      address: sponsor.address || null,
      image_path: sponsor.imagePath,
    })
    .eq("id", sponsor.id);

  if (error) throw error;
}

export async function deleteSponsor(sponsor: Sponsor) {
  const { error } = await supabase.from("sponsors").delete().eq("id", sponsor.id);
  if (error) throw error;

  await supabase.storage.from(SPONSORS_BUCKET).remove([sponsor.imagePath]);
}

export async function uploadSponsorImage(id: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${id}/${Date.now()}-${slugFileName(file.name, `banner.${extension}`)}`;
  const { error } = await supabase.storage.from(SPONSORS_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export function getSponsorImageUrl(imagePath: string): string {
  return supabase.storage.from(SPONSORS_BUCKET).getPublicUrl(imagePath).data.publicUrl;
}

export async function getMuralArtists(): Promise<MuralArtist[]> {
  const { data, error } = await supabase
    .from("mural_artistas")
    .select("*")
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMuralArtist(row as MuralArtistRow));
}

export async function getPublishedMuralArtists(): Promise<MuralArtist[]> {
  const { data, error } = await supabase
    .from("mural_artistas")
    .select("*")
    .eq("status", "published")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("publicado_em", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMuralArtist(row as MuralArtistRow));
}

export async function saveMuralArtist(input: {
  id: string;
  name: string;
  testimonial: string;
  artisticSegment: string;
  imageUrl: string;
  imageAlt: string;
  order: number;
  status: MuralStatus;
  active: boolean;
}) {
  const { error } = await supabase.from("mural_artistas").insert({
    id: input.id,
    nome: cleanText(input.name),
    depoimento: cleanText(input.testimonial),
    segmento_artistico: cleanText(input.artisticSegment) || null,
    imagem_url: input.imageUrl,
    imagem_alt: cleanText(input.imageAlt),
    ordem: Number.isFinite(input.order) ? input.order : 0,
    status: input.status,
    ativo: input.active,
    publicado_em: input.status === "published" ? new Date().toISOString() : null,
  });

  if (error) throw error;
}

export async function updateMuralArtist(input: MuralArtist) {
  const { error } = await supabase
    .from("mural_artistas")
    .update({
      nome: cleanText(input.name),
      depoimento: cleanText(input.testimonial),
      segmento_artistico: cleanText(input.artisticSegment) || null,
      imagem_url: input.imageUrl,
      imagem_alt: cleanText(input.imageAlt),
      ordem: Number.isFinite(input.order) ? input.order : 0,
      status: input.status,
      ativo: input.active,
      publicado_em:
        input.status === "published" ? (input.publishedAt ?? new Date().toISOString()) : null,
    })
    .eq("id", input.id);

  if (error) throw error;
}

export async function deleteMuralArtist(id: string) {
  const { error } = await supabase.from("mural_artistas").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadMuralArtistImage(file: File, artistName: string): Promise<string> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("artistName", artistName);

  const response = await fetch("/api/mural/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as { path?: string; error?: string };
  if (!response.ok || !payload.path) {
    throw new Error(payload.error || "Não foi possível enviar a imagem.");
  }

  return payload.path;
}

export async function deleteMuralArtistImage(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/mural/")) return;
  const token = await getAuthToken();
  const response = await fetch("/api/mural/file", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: imageUrl }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Não foi possível remover a imagem.");
  }
}

export async function getAuthToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada.");
  return token;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function isAuthed(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export function onAuthChange(callback: (authed: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });

  return () => data.subscription.unsubscribe();
}

export function uid() {
  return crypto.randomUUID();
}

function slugFileName(fileName: string, fallback: string) {
  const base = fileName.trim() || fallback;
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
