const rawSiteUrl =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://gralha.vercel.app";

export const siteUrl = rawSiteUrl.replace(/\/$/, "");
export const siteName = "A Gralha";
export const defaultTitle = "A Gralha - Jornal Cultural";
export const defaultDescription =
  "Jornal literário e artístico A Gralha, com edições completas, colunas e vozes da cultura brasileira.";
export const socialImageUrl = absoluteUrl("/social-preview.png");

type MetaTag = Record<string, string>;
type LinkTag = Record<string, string>;
type ScriptTag = Record<string, string>;

interface SeoInput {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  imageType?: string;
  imageWidth?: string;
  imageHeight?: string;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createSeo({
  title = defaultTitle,
  description = defaultDescription,
  path = "/",
  type = "website",
  image = socialImageUrl,
  imageAlt = "Logo do jornal cultural A Gralha",
  imageType = "image/png",
  imageWidth = "512",
  imageHeight = "512",
}: SeoInput = {}) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "author", content: "Editora A Gralha" },
      { name: "robots", content: "index, follow" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: siteName },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:secure_url", content: imageUrl },
      { property: "og:image:type", content: imageType },
      { property: "og:image:width", content: imageWidth },
      { property: "og:image:height", content: imageHeight },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: imageAlt },
    ] satisfies MetaTag[],
    links: [{ rel: "canonical", href: url }] satisfies LinkTag[],
  };
}

export function jsonLd(data: unknown): ScriptTag {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    inLanguage: "pt-BR",
    publisher: organizationJsonLd(),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: socialImageUrl,
  };
}
