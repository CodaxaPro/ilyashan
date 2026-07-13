import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo-meta";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata: Metadata = pageMetadata({
  title: `Datenschutz | ${siteConfig.name}`,
  description: `Datenschutzerklärung — ${siteConfig.name}. Informationen zur Datenverarbeitung auf ilyashan.de.`,
  path: "/datenschutz",
});

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold mb-8">Datenschutzerklärung</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-muted">
            <section>
              <h2 className="text-xl font-bold text-foreground">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-lg font-semibold text-foreground mt-4">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">2. Verantwortliche Stelle</h2>
              <p>
                {siteConfig.name}<br />
                {siteConfig.contact.address}<br />
                {siteConfig.contact.postalCode} {siteConfig.contact.city}<br />
                Telefon: {siteConfig.contact.phoneDisplay}<br />
                E-Mail: {siteConfig.contact.email}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">3. Datenerfassung auf dieser Website</h2>
              <h3 className="text-lg font-semibold text-foreground mt-4">Kontaktformular</h3>
              <p>
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus
                dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks
                Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
                Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) und Art. 6 Abs. 1
                lit. a DSGVO (Einwilligung).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">4. Google Ads & Conversion Tracking</h2>
              <p>
                Diese Website nutzt Google Ads, einen Online-Werbedienst der Google Ireland Limited.
                Google Ads verwendet Cookies, um Anzeigen zu schalten, die für Nutzer relevant sind.
              </p>
              <p>
                Mit dem Google Conversion Tracking kann {siteConfig.name} erkennen, ob nach einem
                Klick auf eine Google-Anzeige eine bestimmte Aktion (z.B. Anfrage über das Formular)
                durchgeführt wurde. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung über
                Cookie-Banner).
              </p>
              <p>
                Weitere Informationen:{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Google Datenschutzerklärung
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">5. Ihre Rechte</h2>
              <p>Sie haben jederzeit das Recht:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Auskunft über Ihre gespeicherten Daten zu erhalten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO)</li>
                <li>Löschung Ihrer Daten zu verlangen (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit zu verlangen (Art. 20 DSGVO)</li>
                <li>Der Verarbeitung zu widersprechen (Art. 21 DSGVO)</li>
                <li>Eine erteilte Einwilligung zu widerrufen (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">6. SSL-Verschlüsselung</h2>
              <p>
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
                Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen
                Sie daran, dass die Adresszeile des Browsers von &ldquo;http://&rdquo; auf &ldquo;https://&rdquo; wechselt.
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
