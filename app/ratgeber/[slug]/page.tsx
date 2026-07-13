import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideLanding } from "@/components/landing/GuideLanding";
import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { getGuidePage, GUIDE_SLUGS } from "@/lib/landing-pages";
import { guidePageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getGuidePage(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
  });
}

export default async function GuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const page = getGuidePage(slug);
  if (!page) notFound();

  return (
    <LandingShell>
      <JsonLd data={guidePageSchemas(page)} />
      <GuideLanding page={page} />
    </LandingShell>
  );
}
