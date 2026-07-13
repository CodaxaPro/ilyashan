import Link from "next/link";

import { Button } from "@/components/ui/Button";
import type { PackagePageContent } from "@/lib/landing-pages";
import { PACKAGE_SLUGS } from "@/lib/landing-pages";
import { getAngebotUrl, getGutscheinUrl } from "@/lib/tracking";

import { ClosingCta } from "./shared/ClosingCta";
import { EmotionGrid } from "./shared/EmotionGrid";
import { FaqSection } from "./shared/FaqSection";
import { JourneySteps } from "./shared/JourneySteps";
import { Section } from "./shared/Section";

type Props = {
  page: PackagePageContent;
};

export function PackageLanding({ page }: Props) {
  const angebotUrl = getAngebotUrl({ channel: "package", slug: page.slug });
  const gutscheinUrl = getGutscheinUrl({ channel: "package", slug: page.slug });

  return (
    <>
      <section className="gradient-hero text-white section-padding pt-28 md:pt-32">
        <div className="landing-container max-w-3xl">
          <p className="eyebrow !text-sky-200 mb-4">{page.hero.eyebrow}</p>
          <h1 className="headline-xl text-white mb-5">{page.hero.headline}</h1>
          <p className="text-lg text-white/85 leading-relaxed mb-4">{page.hero.subline}</p>
          <p className="text-sm text-white/60 mb-8">{page.hero.trust}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button href={angebotUrl} variant="primary" size="lg">
              {page.closing.cta}
            </Button>
            <Button href={gutscheinUrl} variant="outline" size="lg">
              Gutschein bestellen
            </Button>
          </div>
        </div>
      </section>

      <div className="py-4 bg-primary-light border-b border-border">
        <div className="landing-container flex justify-between items-center gap-4">
          <p className="text-2xl font-bold text-primary">{page.priceFrom}</p>
          <p className="text-sm text-muted">Ilyashan Fensterreinigung · Baesweiler</p>
        </div>
      </div>

      <Section className="bg-white">
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

      <Section className="bg-white">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="eyebrow mb-3">{page.includes.eyebrow}</p>
            <h2 className="headline-lg mb-6">{page.includes.headline}</h2>
            <ul className="space-y-3">
              {page.includes.items.map((item) => (
                <li key={item} className="flex gap-3 text-muted border-l-2 border-primary pl-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">{page.forWhom.eyebrow}</p>
            <h2 className="headline-lg mb-6">{page.forWhom.headline}</h2>
            <div className="space-y-6">
              {page.forWhom.items.map((item) => (
                <div key={item.title}>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-card">
        <JourneySteps eyebrow={page.journey.eyebrow} headline={page.journey.headline} steps={page.journey.steps} />
      </Section>

      <Section className="bg-white">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Weitere Leistungen</p>
          <h2 className="headline-lg">Alle Pakete im Überblick</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {PACKAGE_SLUGS.filter((s) => s !== page.slug).map((slug) => (
            <Link key={slug} href={`/fensterreinigung/${slug}`} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40">
              <h3 className="font-bold capitalize mb-1">{slug}</h3>
              <span className="text-sm text-primary">Entdecken →</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <FaqSection title={page.hero.eyebrow} items={page.faq} />
      </Section>

      <Section className="gradient-hero text-white">
        <ClosingCta
          headline={page.closing.headline}
          text={page.closing.text}
          primaryHref={angebotUrl}
          primaryLabel={page.closing.cta}
          secondaryHref={gutscheinUrl}
          secondaryLabel="Gutschein bestellen"
          dark
        />
      </Section>
    </>
  );
}
