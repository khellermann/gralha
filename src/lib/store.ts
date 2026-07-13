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

  await supabase.storage.from(EDITIONS_BUCKET).remove([edition.pdfPath]);
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

export function getEditionPdfUrl(pdfPath: string): string {
  return supabase.storage.from(EDITIONS_BUCKET).getPublicUrl(pdfPath).data.publicUrl;
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
