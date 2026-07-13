import type { Metadata } from "next";

import JsonLd from "@/components/landing/JsonLd";
import { GiftLanding } from "@/components/landing/GiftLanding";
import { LandingShell } from "@/components/landing/LandingShell";
import { getGiftHub } from "@/lib/landing-pages";
import { giftPageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

export async function generateMetadata(): Promise<Metadata> {
  const hub = getGiftHub();
  return pageMetadata({
    title: hub.seo.title,
    description: hub.seo.description,
    path: "/gutschein",
  });
}

export default function GutscheinPage() {
  const hub = getGiftHub();

  return (
    <LandingShell>
      <JsonLd data={giftPageSchemas(hub)} />
      <GiftLanding page={hub} showOccasions />
    </LandingShell>
  );
}
