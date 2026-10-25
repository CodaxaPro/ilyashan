import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { companyServices } from "@/lib/company-services";
import { homeFaq } from "@/lib/service-pages";
import { routes } from "@/lib/routes";
import { ServiceChoice } from "@/components/home/ServiceChoice";

const facts = [
  { label: "Sitz", value: `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}` },
  { label: "Antwort", value: siteConfig.business.responseTime },
  { label: "Anfahrt", value: "Kein Zuschlag in der Region" },
  { label: "Google", value: `${siteConfig.business.rating.toString().replace(".", ",")} aus ${siteConfig.business.reviews} Bewertungen` },
];

export function CompanyHome() {
  const cities = siteConfig.serviceArea.regions.flatMap((region) => region.areas);

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-end gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-20 lg:pt-32">
          <div className="lg:col-span-6">
            <p className="text-sm font-medium text-primary">Aachen und Baesweiler</p>
            <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.12] text-foreground sm:text-5xl">
              Reinigung in Aachen und Baesweiler.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Fensterreinigung, Büroreinigung, Bauendreinigung, Renovierungsreinigung, Praxisreinigung
              und Entrümpelung.
            </p>
            <ServiceChoice />
            <p className="mt-4 text-sm text-muted">
              Fensterpreis sofort. Büro nach Fläche. Die anderen vier Leistungen zum Festpreis nach Besichtigung. Versichert.
            </p>
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="mt-6 inline-block font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
            >
              {siteConfig.contact.phoneDisplay}
            </a>
          </div>
          <figure className="lg:col-span-6">
            <Image
              src="/images/bueroreinigung.jpg"
              alt="Leeres Büro mit Schreibtischen, Teppich und Glaswand nach der Reinigung."
              width={1400}
              height={1050}
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full"
            />
            <figcaption className="mt-3 pr-16 text-sm text-muted sm:pr-0">
              Ergebnis nach der Reinigung. Büro, Praxis, Bau und Wohnung.
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="leistungen" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">Leistungen</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Sechs Leistungen. Jede Karte führt zur eigenen Seite.
          </p>
          <div className="service-grid mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {companyServices.map((service) => (
              <article key={service.href} className="service-card group flex flex-col bg-card">
                <Link href={service.href} className="block overflow-hidden">
                  <Image
                    src={service.image}
                    alt=""
                    width={1400}
                    height={1050}
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className={`service-card-image aspect-4/3 w-full object-cover ${service.imagePosition}`}
                  />
                </Link>
                <div className="flex flex-1 flex-col border-t border-border/60 p-6 sm:p-8">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                    {service.tag}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl">
                    <Link href={service.href} className="transition-colors hover:text-primary">
                      {service.title}
                    </Link>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{service.line}</p>
                  <Link
                    href={service.nextHref}
                    className="service-card-cta mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    {service.nextLabel}
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border">
        <dl className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted">{fact.label}</dt>
              <dd className="mt-2 text-sm leading-relaxed">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="einsatzgebiet" className="scroll-mt-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-4">
            <h2 className="font-serif text-3xl font-medium sm:text-4xl">Einsatzgebiet</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Der Sitz ist Baesweiler. In Aachen und den genannten Orten gibt es keinen Anfahrtszuschlag.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:col-span-8">
            {cities.map((city) => (
              <li key={city} className="border-b border-border py-2">
                {city}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="font-serif text-3xl font-medium">Fragen</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {homeFaq.map((item) => (
              <div key={item.q} className="py-5">
                <h3 className="font-medium">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <h2 className="font-serif text-3xl font-medium sm:text-4xl">Anfrage</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Nennen Sie die Leistung, den Ort und die Größe. Den Festpreis gibt es nach der Besichtigung.
              Fenster und Büro können Sie vorher kalkulieren.
            </p>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <a href={`tel:${siteConfig.contact.phone}`} className="border border-border bg-card p-5 hover:border-primary">
              <span className="block text-xs uppercase tracking-[0.16em] text-muted">Anrufen</span>
              <span className="mt-2 block font-serif text-xl">{siteConfig.contact.phoneDisplay}</span>
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="border border-border bg-card p-5 hover:border-primary">
              <span className="block text-xs uppercase tracking-[0.16em] text-muted">Schreiben</span>
              <span className="mt-2 block font-serif text-xl">{siteConfig.contact.email}</span>
            </a>
            <Link href={routes.angebot} className="border border-border bg-card p-5 hover:border-primary">
              <span className="block text-xs uppercase tracking-[0.16em] text-muted">Fensterreinigung</span>
              <span className="mt-2 block font-serif text-xl">Preis berechnen</span>
            </Link>
            <Link href={routes.bueroreinigungAngebot} className="border border-border bg-card p-5 hover:border-primary">
              <span className="block text-xs uppercase tracking-[0.16em] text-muted">Büroreinigung</span>
              <span className="mt-2 block font-serif text-xl">Fläche kalkulieren</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
