import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo-meta";
import { getBueroServiceSchema } from "@/lib/schema";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export const metadata: Metadata = pageMetadata({
  title: `Büroreinigung ${siteConfig.contact.region} – Gewerbe`,
  description: `Professionelle Büroreinigung in ${siteConfig.contact.region}. Strukturierte Kalkulation für Flächen, Sanitär und Küche. Unverbindliche Preisindikation online.`,
  path: "/bueroreinigung",
});

export default function BueroeinigungHubPage() {
  const schema = getBueroServiceSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="min-h-screen">
        <section className="bg-primary pt-28 sm:pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-white/80 text-sm font-medium mb-3">Ilyashan · Gewerbe</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Büroreinigung
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Aufgabenbasierte Kalkulation für Ihre Immobilie – klar, nachvollziehbar,
              ohne pauschalen €/m²-Schnellschuss.
            </p>
            <Button href={routes.bueroreinigungAngebot} variant="primary" size="lg">
              Angebot jetzt berechnen
            </Button>
          </div>
        </section>

        <section className="py-14 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Was wir kalkulieren</h2>
              <p className="text-foreground/80 leading-relaxed">
                Flächenverteilung, Bodenarten, Arbeitsplätze, Sanitär, Teeküche und
                ausgewählte Zusatzleistungen. Fensterreinigung bleibt ein separater Service.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Region</h2>
              <p className="text-foreground/80 leading-relaxed">
                {siteConfig.contact.region} und Umgebung – PLZ und Ort fließen in Anfahrt und
                Angebot ein.
              </p>
            </div>
            <p className="text-sm text-foreground/60">
              Fensterputzen gesucht?{" "}
              <Link href={routes.angebot} className="text-primary font-semibold underline">
                Zum Fenster-Angebot
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
