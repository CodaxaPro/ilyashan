import type { Metadata } from "next";

import JsonLd from "@/components/landing/JsonLd";
import { LandingShell } from "@/components/landing/LandingShell";
import { ServiceHubLanding } from "@/components/landing/ServiceHubLanding";
import { getFensterreinigungHub } from "@/lib/landing-pages";
import { hubPageSchemas } from "@/lib/landing-schema";
import { pageMetadata } from "@/lib/seo-meta";

export async function generateMetadata(): Promise<Metadata> {
  const hub = getFensterreinigungHub();
  return pageMetadata({
    title: hub.seo.title,
    description: hub.seo.description,
    path: "/fensterreinigung",
  });
}

export default function FensterreinigungPage() {
  const hub = getFensterreinigungHub();

  return (
    <LandingShell>
      <JsonLd data={hubPageSchemas(hub.seo.title, hub.seo.description, hub.path, "Fensterreinigung")} />
      <ServiceHubLanding hub={hub} />
    </LandingShell>
  );
}
