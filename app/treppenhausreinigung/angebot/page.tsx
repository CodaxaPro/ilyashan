import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo-meta";
import { getTreppenhausServiceSchema } from "@/lib/schema";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TreppenhausCalculator } from "@/components/treppenhaus/TreppenhausCalculator";

export const metadata: Metadata = pageMetadata({
  title: `Treppenhausreinigung Preis berechnen – ${siteConfig.contact.region}`,
  description: `Treppenhausreinigung in ${siteConfig.contact.region} kalkulieren: Stockwerke, Wohnungen, Turnus und Keller. Unverbindliche Monatsindikation, Festpreis nach Prüfung.`,
  path: "/treppenhausreinigung/angebot",
});

export default function TreppenhausAngebotPage() {
  const schema = getTreppenhausServiceSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-primary pt-28 pb-12 sm:pt-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="mb-3 text-sm text-white/70">Treppenhausreinigung · Aachen und Baesweiler</p>
            <h1 className="mb-3 font-serif text-3xl font-medium text-white sm:text-4xl">
              Treppenhauspreis kalkulieren
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              Stockwerke, Wohnungen, Turnus und Keller. Unverbindliche Orientierung — Festpreis nach
              Prüfung.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-6 border border-border bg-card px-5 py-4 text-sm leading-relaxed text-foreground/85">
              <strong className="text-foreground">Keller:</strong> Der Turnus folgt dem Treppenhaus.
              Monatlich ist immer wählbar — nicht häufiger als das Treppenhaus.
            </div>
            <div className="border border-border bg-white p-4 sm:p-6 lg:p-8">
              <TreppenhausCalculator />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
