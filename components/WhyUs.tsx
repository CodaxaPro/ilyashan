import Image from "next/image";
import { siteConfig } from "@/lib/config";

export function WhyUs() {
  return (
    <section id="vorteile" className="py-20 lg:py-28 bg-linear-to-b from-primary-light/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Warum wir?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-6">
              Ihr Partner für kristallklare Fenster in {siteConfig.contact.region}
            </h2>
            <p className="text-muted text-lg mb-8 leading-relaxed">
              Seit {siteConfig.business.founded} reinigen wir Fenster mit Leidenschaft und Präzision.
              Über {siteConfig.business.customers} zufriedene Kunden vertrauen auf unsere Qualität –
              und das mit gutem Grund.
            </p>

            <div className="space-y-6">
              {siteConfig.usps.map((usp, i) => (
                <div key={usp.title} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{usp.title}</h3>
                    <p className="text-muted text-sm mt-1">{usp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 p-6 sm:p-8 border border-border">
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-black/5">
                <Image
                  src="/images/fenster-vorher-nachher.png"
                  alt="Fensterreinigung Vorher und Nachher – streifenfreies Ergebnis in Baesweiler"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

                <div className="absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 items-center">
                  <div className="h-full w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.25)]" />
                  <div className="absolute left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-white/95 shadow-lg backdrop-blur-sm">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
                    </svg>
                  </div>
                </div>

                <div className="absolute top-4 left-4 z-10 rounded-full bg-slate-900/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  Vorher
                </div>
                <div className="absolute top-4 right-4 z-10 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-md">
                  Nachher
                </div>

                <div className="absolute bottom-4 inset-x-4 z-10 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
                    <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">Streifenfrei garantiert</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
                {[
                  { label: "Erfahrung", value: `${new Date().getFullYear() - parseInt(siteConfig.business.founded)}+ Jahre` },
                  { label: "Kunden", value: siteConfig.business.customers },
                  { label: "Bewertung", value: `${siteConfig.business.rating}★` },
                ].map((item) => (
                  <div key={item.label} className="text-center rounded-xl bg-card p-3 sm:p-4">
                    <div className="font-bold text-primary text-base sm:text-lg">{item.value}</div>
                    <div className="text-[11px] sm:text-xs text-muted mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 sm:absolute sm:bottom-4 sm:left-4 sm:mt-0 inline-flex rounded-2xl bg-accent px-4 py-3 text-white shadow-xl">
              <div>
                <div className="text-2xl font-bold leading-none">100%</div>
                <div className="mt-1 text-xs opacity-90">Zufriedenheit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
