import { siteConfig } from "@/lib/config";
import type { GiftPageContent, GuidePageContent, LocationPageContent, PackagePageContent } from "@/lib/landing-pages";
import { INTENT_TYPE_LABELS, parseIntentSlug } from "@/lib/seo-config";
import { SITE_URL, canonicalUrl } from "@/lib/seo-meta";

function provider() {
  return {
    "@type": "HomeAndConstructionBusiness" as const,
    name: siteConfig.name,
    url: SITE_URL,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress" as const,
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      postalCode: siteConfig.contact.postalCode,
      addressCountry: "DE",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function webPageSchema(title: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl(path),
    inLanguage: "de-DE",
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: SITE_URL },
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    url: SITE_URL,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      postalCode: siteConfig.contact.postalCode,
      addressCountry: "DE",
    },
    priceRange: "€€",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(siteConfig.business.rating),
      bestRating: "5",
      reviewCount: String(siteConfig.business.reviews),
    },
  };
}

function faqSchema(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function locationPageSchemas(page: LocationPageContent) {
  const parsed = parseIntentSlug(page.slug);
  const crumbs = parsed
    ? [
        { name: "Start", path: "/" },
        { name: INTENT_TYPE_LABELS[parsed.type], path: page.path },
      ]
    : [
        { name: "Start", path: "/" },
        { name: "Region", path: "/fensterreinigung" },
        { name: `Fensterreinigung ${page.city}`, path: page.path },
      ];

  return [
    webPageSchema(page.seo.title, page.seo.description, page.path),
    breadcrumbSchema(crumbs),
    localBusinessSchema(),
    faqSchema(page.faq),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: parsed ? `${INTENT_TYPE_LABELS[parsed.type]} ${page.city}` : `Fensterreinigung ${page.city}`,
      description: page.seo.description,
      provider: provider(),
      areaServed: { "@type": "City", name: page.city },
    },
  ];
}

export function giftPageSchemas(page: GiftPageContent) {
  return [
    webPageSchema(page.seo.title, page.seo.description, page.path),
    breadcrumbSchema([
      { name: "Start", path: "/" },
      { name: "Gutschein", path: "/gutschein" },
      { name: page.hero.eyebrow, path: page.path },
    ]),
    localBusinessSchema(),
    faqSchema(page.faq),
  ];
}

export function packagePageSchemas(page: PackagePageContent) {
  return [
    webPageSchema(page.seo.title, page.seo.description, page.path),
    breadcrumbSchema([
      { name: "Start", path: "/" },
      { name: "Fensterreinigung", path: "/fensterreinigung" },
      { name: page.hero.eyebrow, path: page.path },
    ]),
    localBusinessSchema(),
    faqSchema(page.faq),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.hero.eyebrow,
      description: page.seo.description,
      provider: provider(),
      offers: {
        "@type": "Offer",
        price: page.priceFrom.replace(/[^0-9]/g, "") || "49",
        priceCurrency: "EUR",
      },
    },
  ];
}

export function guidePageSchemas(page: GuidePageContent) {
  return [
    webPageSchema(page.seo.title, page.seo.description, page.path),
    breadcrumbSchema([
      { name: "Start", path: "/" },
      { name: "Ratgeber", path: "/ratgeber" },
      { name: page.hero.headline.slice(0, 60), path: page.path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.hero.headline,
      description: page.seo.description,
      url: canonicalUrl(page.path),
      inLanguage: "de-DE",
      author: { "@type": "Organization", name: siteConfig.name },
    },
    faqSchema(page.faq),
  ];
}

export function hubPageSchemas(title: string, description: string, path: string, name: string) {
  return [
    webPageSchema(title, description, path),
    breadcrumbSchema([
      { name: "Start", path: "/" },
      { name: name, path },
    ]),
    localBusinessSchema(),
  ];
}
