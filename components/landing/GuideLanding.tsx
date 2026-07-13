import Link from "next/link";

import type { GuideHubContent, GuidePageContent } from "@/lib/landing-pages";
import { getAngebotUrl, getGutscheinUrl } from "@/lib/tracking";

import { ClosingCta } from "./shared/ClosingCta";
import { FaqSection } from "./shared/FaqSection";
import { Section } from "./shared/Section";

type ArticleProps = { page: GuidePageContent };
type HubProps = { hub: GuideHubContent };

export function GuideHubLanding({ hub }: HubProps) {
  const angebotUrl = getAngebotUrl({ channel: "guide", slug: "hub" });

  return (
    <>
      <Section className="bg-card pt-28 md:pt-32">
        <div className="max-w-3xl mx-auto text-center">
          <p className="eyebrow mb-3">{hub.hero.eyebrow}</p>
          <h1 className="headline-xl mb-4">{hub.hero.headline}</h1>
          <p className="text-lg text-muted">{hub.hero.subline}</p>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <p className="eyebrow mb-3">{hub.articles.eyebrow}</p>
          <h2 className="headline-lg mb-3">{hub.articles.headline}</h2>
          <p className="text-muted">{hub.articles.intro}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-3xl mx-auto">
          {hub.articles.items.map((item) => (
            <Link
              key={item.slug}
              href={`/ratgeber/${item.slug}`}
              className="bg-card border border-border rounded-xl p-8 hover:border-primary/40 transition-colors group"
            >
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{item.label}</h3>
              <p className="text-sm text-muted">{item.hint}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <ClosingCta
          headline={hub.closing.headline}
          text={hub.closing.text}
          primaryHref={angebotUrl}
          primaryLabel={hub.closing.cta}
          secondaryHref={getGutscheinUrl({ channel: "guide", slug: "hub" })}
          secondaryLabel="Gutschein bestellen"
        />
      </Section>
    </>
  );
}

export function GuideLanding({ page }: ArticleProps) {
  const angebotUrl = getAngebotUrl({ channel: "guide", slug: page.slug });

  return (
    <>
      <Section className="bg-card pt-28 md:pt-32">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">{page.hero.eyebrow}</p>
          <h1 className="headline-xl mb-4">{page.hero.headline}</h1>
          <p className="text-lg text-muted">{page.hero.subline}</p>
        </div>
      </Section>

      <Section className="bg-white">
        <article className="max-w-3xl mx-auto space-y-12">
          {page.sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-muted leading-relaxed mb-4">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-muted border-l-2 border-primary pl-4">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>
      </Section>

      {page.keyTakeaways && (
        <Section className="bg-card">
          <div className="max-w-3xl mx-auto">
            <h2 className="headline-lg mb-6 text-center">{page.keyTakeaways.headline}</h2>
            <ul className="space-y-3">
              {page.keyTakeaways.items.map((item) => (
                <li key={item} className="border-l-2 border-primary pl-4 text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      <Section className="bg-white">
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {page.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="border border-border rounded-xl p-5 hover:border-primary/40">
              <h3 className="font-semibold text-sm mb-1">{link.label}</h3>
              <p className="text-xs text-muted">{link.hint}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <FaqSection title="Häufig gefragt" items={page.faq} />
      </Section>

      <Section className="gradient-hero text-white">
        <ClosingCta
          headline={page.closing.headline}
          text={page.closing.text}
          primaryHref={angebotUrl}
          primaryLabel={page.closing.cta}
          secondaryHref={getGutscheinUrl({ channel: "guide", slug: page.slug })}
          secondaryLabel="Gutschein bestellen"
          dark
        />
      </Section>
    </>
  );
}
