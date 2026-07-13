import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { LocationLanding } from "@/components/landing/LocationLanding";
import { getIntentPage, getIntentRelatedLinks } from "@/lib/landing-pages";
import { locationPageSchemas } from "@/lib/landing-schema";
import { getAllIntentSlugs, type IntentSlug } from "@/lib/seo-config";
import { pageMetadata } from "@/lib/seo-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllIntentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getIntentPage(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
  });
}

export default async function IntentPage({ params }: Props) {
  const { slug } = await params;
  const page = getIntentPage(slug);
  if (!page) notFound();

  return (
    <LandingShell>
      <JsonLd data={locationPageSchemas(page)} />
      <LocationLanding page={page} relatedLinks={getIntentRelatedLinks(slug as IntentSlug)} />
    </LandingShell>
  );
}
