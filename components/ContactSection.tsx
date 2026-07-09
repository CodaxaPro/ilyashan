import { siteConfig } from "@/lib/config";
import { ContactForm } from "@/components/ContactForm";

export function ContactSection() {
  return (
    <section id="angebot" className="py-20 lg:py-28 bg-linear-to-b from-white to-primary-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Kostenloses Angebot</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
              Jetzt unverbindlich anfragen
            </h2>
            <p className="text-muted text-lg mb-8 leading-relaxed">
              Füllen Sie das Formular aus und erhalten Sie innerhalb von{" "}
              {siteConfig.business.responseTime} ein transparentes Festpreis-Angebot.
              Keine versteckten Kosten – garantiert.
            </p>

            <div className="space-y-4">
              {[
                { icon: "✓", text: "Kostenlos & unverbindlich" },
                { icon: "✓", text: "Antwort in 24 Stunden" },
                { icon: "✓", text: "Transparenter Festpreis" },
                { icon: "✓", text: "Keine versteckten Kosten" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-sm font-bold">
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

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

          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary/5 border border-border">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
