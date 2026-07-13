import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/landing/JsonLd";
import { GiftLanding } from "@/components/landing/GiftLanding";
import { LandingShell } from "@/components/landing/LandingShell";
import { getGiftPage, GIFT_SLUGS } from "@/lib/landing-pages";
import { giftPageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GIFT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getGiftPage(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
  });
}

export default async function GiftSubPage({ params }: Props) {
  const { slug } = await params;
  const page = getGiftPage(slug);
  if (!page) notFound();

  return (
    <LandingShell>
      <JsonLd data={giftPageSchemas(page)} />
      <GiftLanding page={page} />
    </LandingShell>
  );
}
