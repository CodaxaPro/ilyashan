import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { companyServices } from "@/lib/company-services";
import { siteConfig } from "@/lib/config";
import type { FensterreinigungHubContent } from "@/lib/landing-pages";
import { LOCAL_SEO_LINKS } from "@/lib/landing-pages";
import { getAngebotUrl, getGutscheinUrl } from "@/lib/tracking";

import { ClosingCta } from "./shared/ClosingCta";
import { ServicePackageCards } from "./shared/ServicePackageCards";
import { EmotionGrid } from "./shared/EmotionGrid";
import { FaqSection } from "./shared/FaqSection";
import { JourneySteps } from "./shared/JourneySteps";
import { Section } from "./shared/Section";

type Props = {
  hub: FensterreinigungHubContent;
};

export function ServiceHubLanding({ hub }: Props) {
  const angebotUrl = getAngebotUrl({ channel: "fensterreinigung" });
  const gutscheinUrl = getGutscheinUrl({ channel: "fensterreinigung" });

  return (
    <>
      <section className="gradient-hero text-white section-padding pt-28 md:pt-32">
        <div className="landing-container max-w-3xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-white/70">{hub.hero.eyebrow}</p>
          <h1 className="headline-xl text-white mb-5">{hub.hero.headline}</h1>
          <p className="text-lg text-white/85 leading-relaxed mb-4">{hub.hero.subline}</p>
          <p className="text-sm text-white/60 mb-8">{hub.hero.trust}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button href={angebotUrl} variant="onDark" size="lg">
              {hub.closing.cta}
            </Button>
            <Button href="#leistungen" variant="outline" size="lg">
              Leistungen
            </Button>
          </div>
        </div>
      </section>

      <Section className="bg-white">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="eyebrow mb-3">{hub.pain.eyebrow}</p>
            <h2 className="headline-lg mb-4">{hub.pain.headline}</h2>
          </div>
          <div className="space-y-5 text-muted leading-relaxed">
            {hub.pain.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            <p className="text-lg font-semibold text-foreground">{hub.pain.closing}</p>
          </div>
        </div>
      </Section>

      <Section className="bg-card">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <p className="eyebrow mb-3">{hub.promise.eyebrow}</p>
          <h2 className="headline-lg mb-4">{hub.promise.headline}</h2>
          <p className="text-muted">{hub.promise.text}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {hub.stats.map((s) => (
            <div key={s.label} className="border border-border bg-white p-8 text-center">
              <p className="text-4xl font-bold text-primary mb-2">{s.value}</p>
              <p className="text-sm text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <EmotionGrid eyebrow={hub.emotions.eyebrow} headline={hub.emotions.headline} items={hub.emotions.items} />
      </Section>

      <Section id="leistungen" className="bg-card">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Leistungen</p>
          <h2 className="headline-lg">Unsere Fensterreinigung Pakete</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sechs Leistungen. Jede Karte öffnet die eigene Seite, dort steht der nächste Schritt.
          </p>
        </div>
        <ServicePackageCards />
      </Section>

      <Section className="bg-white">
        <JourneySteps eyebrow={hub.journey.eyebrow} headline={hub.journey.headline} steps={hub.journey.steps} />
      </Section>

      <Section className="bg-card">
        <div className="text-center mb-8">
          <p className="eyebrow mb-3">Einsatzgebiet</p>
          <h2 className="headline-lg mb-3">Fensterreinigung in Ihrer Stadt</h2>
          <p className="text-muted">{siteConfig.serviceArea.noTravelFeeLabel} in allen genannten Gebieten</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {LOCAL_SEO_LINKS.map((link) => (
            <Link
              key={link.slug}
              href={`/fensterreinigung-${link.slug}`}
              className="border border-border bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <h2 className="headline-lg mb-4">Weitere Leistungen</h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Ilyashan reinigt nicht nur Fenster. Büro, Praxis, Bauende, Renovierung und Entrümpelung haben eigene Seiten.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {companyServices.map((service) => (
            <li key={service.href}>
              <Link href={service.href} className="underline decoration-border underline-offset-4 hover:text-primary">
                {service.title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="bg-card">
        <FaqSection title="Fensterreinigung — häufige Fragen" items={hub.faq} />
      </Section>

      <Section className="gradient-hero text-white">
        <ClosingCta
          headline={hub.closing.headline}
          text={hub.closing.text}
          primaryHref={angebotUrl}
          primaryLabel={hub.closing.cta}
          secondaryHref={gutscheinUrl}
          secondaryLabel="Gutschein bestellen"
          dark
        />
      </Section>
    </>
  );
}
