import type { Metadata } from "next";
import { ServiceLanding } from "@/components/company/ServiceLanding";
import { pageMetadata } from "@/lib/seo-meta";
import { servicePages } from "@/lib/service-pages";

const page = servicePages.treppenhaus;

export const metadata: Metadata = pageMetadata({
  title: page.metaTitle,
  description: page.description,
  path: page.path,
});

export default function TreppenhausreinigungPage() {
  return <ServiceLanding page={page} />;
}
