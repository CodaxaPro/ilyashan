import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

const wizardSteps = [
  "Leistung wählen",
  "Objekt angeben",
  "Details & Preis",
  "Termin wählen",
  "Kontakt & Absenden",
];

export function ContactSection() {
  return (
    <section id="angebot" className="py-20 lg:py-28 bg-linear-to-b from-white to-primary-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              {siteConfig.messaging.livePricingBadge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
              {siteConfig.messaging.sectionTitle}
            </h2>
            <p className="text-muted text-lg mb-8 leading-relaxed">
              {siteConfig.messaging.contactIntro}
            </p>

            <div className="space-y-4 mb-8">
              {wizardSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </div>
              ))}
            </div>

            <Button href={routes.angebot} variant="primary" size="lg" className="w-full sm:w-auto">
              {siteConfig.messaging.ctaPrimary}
            </Button>

            <div className="mt-8 p-6 bg-white rounded-2xl border border-border">
              <h3 className="font-bold mb-3">Direkt kontaktieren</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted">Telefon:</span>{" "}
                  <a href={`tel:${siteConfig.contact.phone}`} className="text-primary font-semibold">
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </p>
                <p>
                  <span className="text-muted">E-Mail:</span>{" "}
                  <a href={`mailto:${siteConfig.contact.email}`} className="text-primary font-semibold">
                    {siteConfig.contact.email}
                  </a>
                </p>
                <p>
                  <span className="text-muted">Einsatzgebiet:</span>{" "}
                  <span className="font-semibold">{siteConfig.contact.region}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-primary/5 border border-border">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">{siteConfig.messaging.wizardCardTitle}</h3>
              <p className="text-muted mb-6 leading-relaxed">
                {siteConfig.messaging.wizardCardDesc}
              </p>
              <ul className="text-left space-y-2 mb-8 text-sm">
                {siteConfig.messaging.wizardBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button href={routes.angebot} variant="primary" size="lg" className="w-full">
                {siteConfig.messaging.ctaPrimary}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
