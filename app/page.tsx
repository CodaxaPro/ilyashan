import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { ServiceArea } from "@/components/ServiceArea";
import { Services } from "@/components/Services";
import { WhyUs } from "@/components/WhyUs";
import { Process } from "@/components/Process";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { ContactSection } from "@/components/ContactSection";
import { CTABanner } from "@/components/CTABanner";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <ServiceArea />
        <Services />
        <WhyUs />
        <Process />
        <Testimonials />
        <FAQ />
        <ContactSection />
        <CTABanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
