import type { MetadataRoute } from "next";

import {
  GIFT_SLUGS,
  GUIDE_SLUGS,
  INTENT_SEO_LINKS,
  LOCATION_SLUGS,
  PACKAGE_SLUGS,
} from "@/lib/landing-pages";
import { SITE_URL } from "@/lib/seo-meta";

const baseUrl = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const giftSubPages = GIFT_SLUGS.map((slug) => ({
    url: `${baseUrl}/gutschein/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const packagePages = PACKAGE_SLUGS.map((slug) => ({
    url: `${baseUrl}/fensterreinigung/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const locationPages = LOCATION_SLUGS.map((slug) => ({
    url: `${baseUrl}/fensterreinigung-${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const guidePages = GUIDE_SLUGS.map((slug) => ({
    url: `${baseUrl}/ratgeber/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const intentPages = INTENT_SEO_LINKS.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.78,
  }));

  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/fensterreinigung`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    ...packagePages,
    { url: `${baseUrl}/gutschein`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    ...giftSubPages,
    ...locationPages,
    { url: `${baseUrl}/ratgeber`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    ...guidePages,
    ...intentPages,
    { url: `${baseUrl}/angebot`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/impressum`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/datenschutz`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
