import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { PackageLanding } from "@/components/landing/PackageLanding";
import { getPackagePage, PACKAGE_SLUGS } from "@/lib/landing-pages";
import { packagePageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PACKAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPackagePage(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
  });
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const page = getPackagePage(slug);
  if (!page) notFound();

  return (
    <LandingShell>
      <JsonLd data={packagePageSchemas(page)} />
      <PackageLanding page={page} />
    </LandingShell>
  );
}
