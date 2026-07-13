import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";
import type { GiftPageContent } from "@/lib/landing-pages";
import { getAngebotUrl, getGutscheinUrl } from "@/lib/tracking";

import { ClosingCta } from "./shared/ClosingCta";
import { EmotionGrid } from "./shared/EmotionGrid";
import { FaqSection } from "./shared/FaqSection";
import { JourneySteps } from "./shared/JourneySteps";
import { Section } from "./shared/Section";

type Props = {
  page: GiftPageContent;
  showOccasions?: boolean;
};

export function GiftLanding({ page, showOccasions = false }: Props) {
  const gutscheinUrl = getGutscheinUrl({ channel: "gift", slug: page.slug === "hub" ? undefined : page.slug });
  const featuredReview = siteConfig.testimonials[0];

  return (
    <>
      <section className="gradient-hero text-white section-padding pt-28 md:pt-32">
        <div className="landing-container max-w-3xl">
          <p className="eyebrow !text-sky-200 mb-4">{page.hero.eyebrow}</p>
          <h1 className="headline-xl text-white mb-5">{page.hero.headline}</h1>
          <p className="text-lg text-white/85 leading-relaxed mb-4">{page.hero.subline}</p>
          <p className="text-sm text-white/60 mb-8">{page.hero.trust}</p>
          <Button href={gutscheinUrl} variant="primary" size="lg">
            {page.closing.cta}
          </Button>
        </div>
      </section>

      <Section id="was-du-schenkst" className="bg-white">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="eyebrow mb-3">{page.essence.eyebrow}</p>
            <h2 className="headline-lg">{page.essence.headline}</h2>
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

      {page.recipients && (
        <Section className="bg-white">
          <div className="text-center mb-10">
            <p className="eyebrow mb-3">{page.recipients.eyebrow}</p>
            <h2 className="headline-lg">{page.recipients.headline}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {page.recipients.items.map((item) => (
              <div key={item.title} className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {showOccasions && page.occasions && (
        <Section className="bg-card">
          <div className="text-center mb-6 max-w-2xl mx-auto">
            <p className="eyebrow mb-3">{page.occasions.eyebrow}</p>
            <h2 className="headline-lg mb-3">{page.occasions.headline}</h2>
            <p className="text-muted">{page.occasions.intro}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 max-w-5xl mx-auto">
            {page.occasions.items.map((item) => (
              <Link
                key={item.slug}
                href={`/gutschein/${item.slug}`}
                className="bg-white border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{item.label}</h3>
                <p className="text-sm text-muted">{item.hint}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section className="bg-white">
        <JourneySteps eyebrow={page.journey.eyebrow} headline={page.journey.headline} steps={page.journey.steps} />
      </Section>

      <Section className="bg-card">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Pakete</p>
          <h2 className="headline-lg">Wählen Sie den passenden Gutschein</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {siteConfig.services.slice(0, 3).map((s) => (
            <div key={s.id} className="bg-white border border-border rounded-xl p-8 text-center">
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-2xl font-bold text-primary mb-4">{s.priceFrom}</p>
              <Button href={gutscheinUrl} variant="secondary" className="w-full justify-center">
                Gutschein bestellen
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-foreground text-white text-center">
        <p className="eyebrow !text-sky-300 mb-6">Stimmen unserer Kunden</p>
        <blockquote className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-4">
          &ldquo;{featuredReview.text.slice(0, 160)}…&rdquo;
        </blockquote>
        <p className="text-white/60">— {featuredReview.name}</p>
      </Section>

      <Section className="bg-white">
        <FaqSection title="Alles Wichtige zum Gutschein" items={page.faq} />
      </Section>

      <Section className="bg-card">
        <ClosingCta
          headline={page.closing.headline}
          text={page.closing.text}
          primaryHref={gutscheinUrl}
          primaryLabel={page.closing.cta}
          secondaryHref={getAngebotUrl({ channel: "gift", slug: page.slug })}
          secondaryLabel="Preis berechnen"
        />
        <p className="text-center text-sm text-muted mt-6 max-w-md mx-auto">
          Sie werden zu unserem sicheren Gutschein-Shop auf treuepay.de weitergeleitet.
        </p>
      </Section>
    </>
  );
}
