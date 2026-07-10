import { siteConfig } from "@/lib/config";
import { CTAButtons } from "@/components/ui/Button";

export function CTABanner() {
  return (
    <section className="py-16 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Bereit für strahlend saubere Fenster?
        </h2>
        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
          {siteConfig.messaging.contactIntro}
        </p>
        <CTAButtons className="justify-center" />
      </div>
    </section>
  );
}
