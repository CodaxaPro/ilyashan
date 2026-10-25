import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo-meta";
import { getBueroServiceSchema } from "@/lib/schema";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CleaningCalculator } from "@/components/cleaning/CleaningCalculator";

export const metadata: Metadata = pageMetadata({
  title: `Büroreinigung Angebot berechnen – ${siteConfig.contact.region}`,
  description: `Gewerbliche Büroreinigung in ${siteConfig.contact.region} kalkulieren: Flächen, Sanitär, Küche und Einsatzdauer. Unverbindliche Preisindikation, strukturiertes Angebot.`,
  path: "/bueroreinigung/angebot",
});

export default function BueroeinigungAngebotPage() {
  const schema = getBueroServiceSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-primary pt-28 pb-12 sm:pt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="mb-3 text-sm text-white/70">Büroreinigung · Aachen und Baesweiler</p>
            <h1 className="mb-3 font-serif text-3xl font-medium text-white sm:text-4xl">
              Bürofläche kalkulieren
            </h1>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl leading-relaxed">
              Strukturierte Angebotsübersicht für Ihre Immobilie. Aufgabenbasierte Kalkulation –
              unverbindliche Preisindikation, verbindliches Angebot nach Prüfung.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-6 border border-border bg-card px-5 py-4 text-sm leading-relaxed text-foreground/85">
              <strong className="text-foreground">Hinweis:</strong> Fensterreinigung /
              Glasreinigung wird in diesem Rechner nicht berechnet – dafür steht der separate
              Fenster-Angebotsprozess zur Verfügung.
            </div>
            <div className="border border-border bg-white p-4 sm:p-6 lg:p-8">
              <CleaningCalculator />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
