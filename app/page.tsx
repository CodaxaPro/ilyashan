import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CompanyHome } from "@/components/home/CompanyHome";
import JsonLd from "@/components/landing/JsonLd";
import { homeFaq } from "@/lib/service-pages";
import { pageMetadata } from "@/lib/seo-meta";

export const metadata: Metadata = pageMetadata({
  title: "Reinigungsfirma in Aachen und Baesweiler | Ilyashan",
  description:
    "Reinigungsfirma in Baesweiler und Aachen. Fensterreinigung, Büroreinigung, Praxisreinigung, Bauendreinigung, Renovierungsreinigung und Entrümpelung. Festpreis, kein Anfahrtszuschlag.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homeFaq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <Header />
      <main>
        <CompanyHome />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
