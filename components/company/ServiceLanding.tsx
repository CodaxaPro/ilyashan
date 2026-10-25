import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { companyServices } from "@/lib/company-services";
import { routes } from "@/lib/routes";
import type { ServicePageContent } from "@/lib/service-pages";
import { serviceLandingSchemas } from "@/lib/landing-schema";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import JsonLd from "@/components/landing/JsonLd";

const facts = [
  { label: "Sitz", value: `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}` },
  { label: "Antwort", value: siteConfig.business.responseTime },
  { label: "Anfahrt", value: "Kein Zuschlag in der Region" },
  {
    label: "Google",
    value: `${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Bewertungen`,
  },
];

export function ServiceLanding({ page }: { page: ServicePageContent }) {
  return (
    <>
      <JsonLd data={serviceLandingSchemas(page)} />
      <Header />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl items-end gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pt-32">
            <div className={page.image ? "lg:col-span-6" : "lg:col-span-8"}>
              <p className="text-sm text-muted">
                <Link href={routes.home} className="hover:text-primary">
                  Ilyashan
                </Link>
                <span aria-hidden="true"> · </span>
                {page.name}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">{page.eyebrow}</p>
              <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.12] sm:text-5xl">{page.title}</h1>
              <p className="mt-5 max-w-xl pr-16 text-lg leading-relaxed text-muted sm:pr-0">{page.lede}</p>
              <div className="mt-8 flex max-w-[calc(100%-4.5rem)] flex-col gap-3 sm:max-w-none sm:flex-row">
                <Button href={`tel:${siteConfig.contact.phone}`} variant="primary" size="lg">
                  {siteConfig.contact.phoneDisplay}
                </Button>
                <Button href={page.primaryHref} variant="secondary" size="lg">
                  {page.primaryLabel}
                </Button>
              </div>
              <p className="mt-4 max-w-xl text-sm text-muted">{page.priceNote}</p>
            </div>
            {page.image ? (
              <figure className="lg:col-span-6">
                <Image
                  src={page.image.src}
                  alt={page.image.alt}
                  width={1400}
                  height={1050}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="h-auto w-full"
                />
                <figcaption className="mt-3 pr-16 text-sm text-muted sm:pr-0">{page.image.caption}</figcaption>
              </figure>
            ) : null}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <h2 className="font-serif text-3xl font-medium">Leistung</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed">
              {page.includes.map((item) => (
                <li key={item} className="border-b border-border pb-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-3xl font-medium">Nicht enthalten</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
              {page.excludes.map((item) => (
                <li key={item} className="border-b border-border pb-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="font-serif text-3xl font-medium">Ablauf</h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-3">
              {page.steps.map((step, index) => (
                <li key={step.title}>
                  <p className="font-serif text-sm text-primary">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-serif text-2xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <dl className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted">{fact.label}</dt>
              <dd className="mt-2 text-sm leading-relaxed">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="font-serif text-3xl font-medium">Fragen</h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {page.faq.map((item) => (
                <div key={item.q} className="py-5">
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div>
              <h2 className="font-serif text-2xl">Weitere Leistungen</h2>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {companyServices.map((service) => (
                  <li key={service.href}>
                    <Link href={service.href} className="underline decoration-border underline-offset-4 hover:text-primary">
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {page.related.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="font-medium hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
