import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";
import type { LocationPageContent, RelatedLink } from "@/lib/landing-pages";
import { getAngebotUrl, getGutscheinUrl, trackingFromPageSlug } from "@/lib/tracking";

import { RelatedLinks } from "./RelatedLinks";
import { ClosingCta } from "./shared/ClosingCta";
import { EmotionGrid } from "./shared/EmotionGrid";
import { FaqSection } from "./shared/FaqSection";
import { JourneySteps } from "./shared/JourneySteps";
import { Section } from "./shared/Section";

type Props = {
  page: LocationPageContent;
  relatedLinks?: RelatedLink[];
};

export function LocationLanding({ page, relatedLinks }: Props) {
  const tracking = trackingFromPageSlug(page.slug);
  const isGift = page.slug.startsWith("geschenk-");
  const angebotUrl = getAngebotUrl(tracking);
  const gutscheinUrl = getGutscheinUrl(isGift ? tracking : { channel: "gift", slug: page.slug });
  const primaryUrl = isGift ? gutscheinUrl : angebotUrl;

  return (
    <>
      <section className="gradient-hero text-white section-padding pt-28 md:pt-32">
        <div className="landing-container max-w-3xl">
          <p className="eyebrow !text-sky-200 mb-4">{page.hero.eyebrow}</p>
          <h1 className="headline-xl text-white mb-5">{page.hero.headline}</h1>
          <p className="text-lg text-white/85 leading-relaxed mb-4">{page.hero.subline}</p>
          <p className="text-sm text-white/60 mb-8">{page.hero.trust}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button href={primaryUrl} variant="primary" size="lg">
              {page.closing.cta}
            </Button>
            <Button href="#leistung" variant="outline" size="lg">
              Leistungen
            </Button>
          </div>
        </div>
      </section>

      <div className="py-4 bg-primary-light border-b border-border">
        <div className="landing-container flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm">
          <p>
            <span className="font-semibold text-foreground">{page.city}</span>
            <span className="text-muted"> · {page.distance}</span>
          </p>
          <p className="text-muted">
            {siteConfig.contact.address}, {siteConfig.contact.postalCode} {siteConfig.contact.city}
          </p>
        </div>
      </div>

      <Section id="leistung" className="bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="eyebrow mb-3">{page.essence.eyebrow}</p>
            <h2 className="headline-lg mb-6">{page.essence.headline}</h2>
          </div>
          <div className="space-y-5 text-muted leading-relaxed">
            {page.essence.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-card">
        <EmotionGrid eyebrow={page.emotions.eyebrow} headline={page.emotions.headline} items={page.emotions.items} />
      </Section>

      <Section className="bg-foreground text-white">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="eyebrow !text-sky-300 mb-3">{page.localProof.eyebrow}</p>
          <h2 className="headline-lg text-white">{page.localProof.headline}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {page.localProof.quotes.map((q) => (
            <blockquote key={q.name} className="border border-white/10 rounded-2xl p-8">
              <p className="text-lg leading-relaxed mb-4">&ldquo;{q.text}&rdquo;</p>
              <footer className="text-sm text-white/50">
                — {q.name}, {q.location}
              </footer>
            </blockquote>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <JourneySteps eyebrow={page.journey.eyebrow} headline={page.journey.headline} steps={page.journey.steps} />
      </Section>

      <Section className="bg-card">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Leistungen</p>
          <h2 className="headline-lg">Fensterreinigung in {page.city}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {siteConfig.services.map((s) => (
            <Link
              key={s.id}
              href={`/fensterreinigung/${s.id}`}
              className="bg-white border border-border rounded-xl p-6 hover:border-primary/40 transition-colors"
            >
              <h3 className="font-bold mb-1">{s.title}</h3>
              <p className="text-primary font-semibold mb-2">{s.priceFrom}</p>
              <p className="text-sm text-muted">{s.description.slice(0, 80)}…</p>
            </Link>
          ))}
        </div>
      </Section>

      {relatedLinks && relatedLinks.length > 0 && (
        <Section className="bg-white border-t border-border">
          <RelatedLinks title={`Passend zu ${page.city}`} links={relatedLinks} />
        </Section>
      )}

      <Section className="bg-card">
        <FaqSection title={`Fensterreinigung ${page.city}`} items={page.faq} />
      </Section>

      <Section className="gradient-hero text-white">
        <ClosingCta
          headline={page.closing.headline}
          text={page.closing.text}
          primaryHref={primaryUrl}
          primaryLabel={page.closing.cta}
          secondaryHref={gutscheinUrl}
          secondaryLabel="Gutschein bestellen"
          dark
        />
      </Section>
    </>
  );
}
