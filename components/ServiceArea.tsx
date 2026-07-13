import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { LOCAL_SEO_LINKS } from "@/lib/landing-pages";

export function ServiceArea() {
  const { serviceArea } = siteConfig;

  return (
    <section id="einsatzgebiet" className="py-20 lg:py-24 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              {serviceArea.title}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4 leading-tight">
              {serviceArea.headline}
            </h2>
            <p className="text-muted text-base leading-relaxed mb-6">
              {serviceArea.description}
            </p>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-accent-light border border-accent/20 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-accent text-sm">{serviceArea.noTravelFeeLabel}</p>
                <p className="text-xs text-muted mt-0.5">In allen aufgeführten Gebieten</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviceArea.regions.map((region) => (
              <div
                key={region.name}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <h3 className="font-bold text-sm text-foreground">{region.name}</h3>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {region.areas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-white border border-border px-3 py-1 text-xs font-medium text-foreground/80"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-border">
          <h3 className="text-center font-bold text-lg mb-2">Fensterreinigung in Ihrer Stadt</h3>
          <p className="text-center text-sm text-muted mb-6">{serviceArea.noTravelFeeLabel} — in allen Städten</p>
          <div className="flex flex-wrap justify-center gap-3">
            {LOCAL_SEO_LINKS.map((link) => (
              <Link
                key={link.slug}
                href={`/fensterreinigung-${link.slug}`}
                className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
