import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { ContactForm } from "@/components/ContactForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CTAButtons } from "@/components/ui/Button";

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
            <CTAButtons className="justify-center" />
          </div>
        </section>

        <section className="py-16 -mt-8">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-border">
              <h2 className="text-2xl font-bold text-center mb-6">
                Jetzt Angebot anfordern
              </h2>
              <ContactForm compact />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
