import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo-meta";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata: Metadata = pageMetadata({
  title: `Impressum | ${siteConfig.name}`,
  description: `Impressum und Kontakt — ${siteConfig.name}, ${siteConfig.contact.address}, ${siteConfig.contact.city}.`,
  path: "/impressum",
});

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold mb-8">Impressum</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-muted">
            <section>
              <h2 className="text-xl font-bold text-foreground">Angaben gemäß § 5 TMG</h2>
              <p>
                {siteConfig.name}<br />
                {siteConfig.contact.address}<br />
                {siteConfig.contact.postalCode} {siteConfig.contact.city}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Kontakt</h2>
              <p>
                Telefon: {siteConfig.contact.phoneDisplay}<br />
                E-Mail: {siteConfig.contact.email}
              </p>
            </section>

            {siteConfig.legal.vatId && (
              <section>
                <h2 className="text-xl font-bold text-foreground">Umsatzsteuer-ID</h2>
                <p>
                  Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
                  <br />
                  {siteConfig.legal.vatId}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold text-foreground">Berufsbezeichnung</h2>
              <p>
                Berufsbezeichnung: Fensterreinigung / Gebäudereinigung
                <br />
                Verliehen in: Deutschland
                {siteConfig.legal.tradeChamber && (
                  <>
                    <br />
                    Zuständige Kammer: {siteConfig.legal.tradeChamber}
                  </>
                )}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  https://ec.europa.eu/consumers/odr/
                </a>
                <br />
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen.
              </p>
            </section>
          </div>

          <div className="mt-10">
            <Link href={routes.home} className="text-primary font-semibold hover:underline">
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
