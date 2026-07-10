import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: `Preis berechnen – Fensterreinigung ${siteConfig.contact.region}`,
  description: `Sofort-Preisschätzung im Angebots-Wizard für Fensterreinigung in ${siteConfig.contact.region}. Verbindliches Festpreis-Angebot in 24 Stunden. Streifenfrei garantiert.`,
};

export default function AngebotPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="gradient-hero pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {siteConfig.messaging.livePricingBadge}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Preis berechnen & Angebot anfordern
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
              {siteConfig.messaging.angebotIntro}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href={`tel:${siteConfig.contact.phone}`} variant="outline" size="lg">
                {siteConfig.contact.phoneDisplay}
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 -mt-8 pb-28 lg:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary-light/30 px-5 py-4 text-sm text-foreground/90 leading-relaxed">
              <strong className="text-primary">So funktioniert es:</strong> Die angezeigte{" "}
              <strong>Live-Preisschätzung</strong> aktualisiert sich bei jeder Auswahl und ist
              unverbindlich. Nach dem Absenden erhalten Sie innerhalb von{" "}
              {siteConfig.business.responseTime} Ihr{" "}
              <strong>verbindliches Festpreis-Angebot</strong> per E-Mail.
            </div>
            <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-border">
              <QuoteWizard />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
