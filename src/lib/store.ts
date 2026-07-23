import editionsData from "@/data/editions.json";
import muralArtistsData from "@/data/mural-artistas.json";
import sponsorsData from "@/data/sponsors.json";

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

const STATIC_MODE_MESSAGE =
  "O site agora usa arquivos JSON no projeto. Edite os arquivos em src/data e faça deploy para publicar alterações.";

export async function getEditions(): Promise<Edition[]> {
  return [...(editionsData as Edition[])].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getEdition(id: string): Promise<Edition | undefined> {
  return (editionsData as Edition[]).find((edition) => edition.id === id);
}

export async function saveEdition() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function updateEdition() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function deleteEdition() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function uploadEditionPdf(): Promise<string> {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function uploadEditionCoverImage(): Promise<string> {
  throw new Error(STATIC_MODE_MESSAGE);
}

export function getEditionPdfUrl(pdfPath: string): string {
  return pdfPath;
}

export function getEditionCoverImagePath(id: string): string {
  return `${id}/cover`;
}

export function getEditionCoverImageUrl(editionOrId: Edition | string): string {
  if (typeof editionOrId !== "string") {
    return editionOrId.coverImageUrl || "/social-preview.png";
  }

  const edition = (editionsData as Edition[]).find((item) => item.id === editionOrId);
  return edition?.coverImageUrl || "/social-preview.png";
}

export async function getSponsors(): Promise<Sponsor[]> {
  return [...(sponsorsData as Sponsor[])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function saveSponsor() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function updateSponsor() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function deleteSponsor() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function uploadSponsorImage(): Promise<string> {
  throw new Error(STATIC_MODE_MESSAGE);
}

export function getSponsorImageUrl(imagePath: string): string {
  return imagePath || "/social-preview.png";
}

export async function getMuralArtists(): Promise<MuralArtist[]> {
  return [...(muralArtistsData as MuralArtist[])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getPublishedMuralArtists(): Promise<MuralArtist[]> {
  const artists = await getMuralArtists();
  return artists.filter((artist) => artist.status === "published" && artist.active);
}

export async function saveMuralArtist() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function updateMuralArtist() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function deleteMuralArtist() {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function uploadMuralArtistImage(): Promise<string> {
  throw new Error(STATIC_MODE_MESSAGE);
}

export async function deleteMuralArtistImage(): Promise<void> {
  return undefined;
}

export function getMuralArtistImageUrl(imagePath: string): string {
  return imagePath || "/social-preview.png";
}

export async function getAuthToken(): Promise<string> {
  return "static-json-mode";
}

export async function signIn(email: string, password: string) {
  if (!email.trim() || !password.trim()) {
    throw new Error("Informe e-mail e senha.");
  }

  localStorage.setItem("agralha-static-admin", "true");
}

export async function signOut() {
  localStorage.removeItem("agralha-static-admin");
}

export async function isAuthed(): Promise<boolean> {
  return localStorage.getItem("agralha-static-admin") === "true";
}

export function onAuthChange(callback: (authed: boolean) => void) {
  const interval = window.setInterval(() => {
    callback(localStorage.getItem("agralha-static-admin") === "true");
  }, 1000);

  return () => window.clearInterval(interval);
}

export function uid() {
  return crypto.randomUUID();
}
