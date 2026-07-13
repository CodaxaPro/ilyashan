import type { Metadata } from "next";

import { GuideHubLanding } from "@/components/landing/GuideLanding";
import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { getGuideHub } from "@/lib/landing-pages";
import { hubPageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

export async function generateMetadata(): Promise<Metadata> {
  const hub = getGuideHub();
  return pageMetadata({
    title: hub.seo.title,
    description: hub.seo.description,
    path: "/ratgeber",
  });
}

export default function RatgeberPage() {
  const hub = getGuideHub();

  return (
    <LandingShell>
      <JsonLd data={hubPageSchemas(hub.seo.title, hub.seo.description, hub.path, "Ratgeber")} />
      <GuideHubLanding hub={hub} />
    </LandingShell>
  );
}
