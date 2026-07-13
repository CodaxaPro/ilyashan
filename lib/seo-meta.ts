import type { Metadata } from "next";

/** Canonical base — includes /de prefix (matches middleware public URLs) */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilyashan.de/de";

/** Public path segment for internal routes (no double /de when SITE_URL already has /de) */
export function publicPath(path: string): string {
  if (path === "/" || path === "/de") return "/de";
  if (path.startsWith("/de/")) return path;
  if (path.startsWith("/de")) return path;
  return `/de${path}`;
}

export function canonicalUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, "");
  if (path === "/" || path === "/de" || path === "") return base;
  const segment = path.startsWith("/de/") ? path.slice(3) : path.startsWith("/de") ? path.slice(2) : path;
  return `${base}${segment.startsWith("/") ? segment : `/${segment}`}`;
}

export function pageMetadata(seo: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogAlt?: string;
}): Metadata {
  const canonical = canonicalUrl(seo.path);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: "de_DE",
      type: "website",
      ...(seo.ogImage && {
        images: [{ url: seo.ogImage, width: 1200, height: 630, alt: seo.ogAlt ?? seo.title }],
      }),
    },
    robots: { index: true, follow: true },
  };
}
