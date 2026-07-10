import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: `Kostenloses Angebot – Fensterreinigung ${siteConfig.contact.region}`,
  description: `Fordern Sie jetzt Ihr kostenloses Festpreis-Angebot für Fensterreinigung in ${siteConfig.contact.region} an. Antwort in 24 Stunden. Streifenfrei garantiert.`,
};

export default function AngebotPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="gradient-hero pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Kostenloses Angebot für Fensterreinigung
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
              Transparentes Festpreis-Angebot in {siteConfig.business.responseTime}.
              Unverbindlich, versichert, streifenfrei garantiert.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href={`tel:${siteConfig.contact.phone}`} variant="outline" size="lg">
                {siteConfig.contact.phoneDisplay}
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 -mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-border">
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
