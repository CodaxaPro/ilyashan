import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { LocationLanding } from "@/components/landing/LocationLanding";
import { getIntentPage } from "@/lib/landing-pages";
import { locationPageSchemas } from "@/lib/landing-schema";
import { getAllIntentSlugs, parseIntentSlug } from "@/lib/seo-config";
import { pageMetadata, SITE_URL } from "@/lib/seo-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllIntentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getIntentPage(slug);
  if (!page) return {};
  if (parseIntentSlug(slug)?.type === "gebaeudereinigung") {
    return {
      title: "Reinigung in Aachen und Baesweiler",
      alternates: { canonical: SITE_URL },
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
  });
}

export default async function IntentPage({ params }: Props) {
  const { slug } = await params;
  if (parseIntentSlug(slug)?.type === "gebaeudereinigung") permanentRedirect("/de");

  const page = getIntentPage(slug);
  if (!page) notFound();

  return (
    <LandingShell>
      <JsonLd data={locationPageSchemas(page)} />
      <LocationLanding page={page} />
    </LandingShell>
  );
}
