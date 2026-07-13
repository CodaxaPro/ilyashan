import { siteConfig } from "@/lib/config";
import {
  INTENT_BY_TYPE,
  LOCAL_SEO_LINKS,
  PACKAGE_SLUGS,
  TOP_GIFT_LINKS,
  TOP_GUIDE_LINKS,
} from "@/lib/landing-pages";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { PhoneIcon } from "@/components/ui/Button";

export function Footer() {
  const topIntentCities = LOCAL_SEO_LINKS.slice(0, 4);

  return (
    <footer className="bg-foreground text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-10">
          <div className="xl:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                I
              </div>
              <span className="font-bold text-white text-lg">{siteConfig.name}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {siteConfig.messaging.footerTagline.replace(
                "24 Stunden",
                siteConfig.business.responseTime,
              )}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Leistungen</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/fensterreinigung" className="hover:text-white transition-colors">
                  Fensterreinigung
                </Link>
              </li>
              {PACKAGE_SLUGS.map((slug) => (
                <li key={slug}>
                  <Link href={`/fensterreinigung/${slug}`} className="hover:text-white transition-colors capitalize">
                    {siteConfig.services.find((s) => s.id === slug)?.title ?? slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Einsatzgebiet</h3>
            <ul className="space-y-2 text-sm">
              {LOCAL_SEO_LINKS.map((link) => (
                <li key={link.slug}>
                  <Link href={`/fensterreinigung-${link.slug}`} className="hover:text-white transition-colors">
                    Fensterreinigung {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">In Ihrer Stadt</h3>
            <ul className="space-y-2 text-sm">
              {INTENT_BY_TYPE.slice(0, 3).map((group) =>
                topIntentCities.map((city) => (
                  <li key={`${group.type}-${city.slug}`}>
                    <Link href={`/${group.type}-${city.slug}`} className="hover:text-white transition-colors">
                      {group.label} {city.label}
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Gutschein & Ratgeber</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gutschein" className="hover:text-white transition-colors">
                  Gutschein Hub
                </Link>
              </li>
              {TOP_GIFT_LINKS.map((g) => (
                <li key={g.slug}>
                  <Link href={`/gutschein/${g.slug}`} className="hover:text-white transition-colors">
                    {g.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/ratgeber" className="hover:text-white transition-colors font-medium text-white/90">
                  Ratgeber
                </Link>
              </li>
              {TOP_GUIDE_LINKS.slice(0, 3).map((g) => (
                <li key={g.slug}>
                  <Link href={`/ratgeber/${g.slug}`} className="hover:text-white transition-colors">
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Kontakt & Rechtliches</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`tel:${siteConfig.contact.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <PhoneIcon className="w-4 h-4" />
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white transition-colors">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>{siteConfig.contact.address}</li>
              <li>{siteConfig.contact.postalCode} {siteConfig.contact.city}</li>
              <li className="pt-2">
                <Link href={routes.angebot} className="hover:text-white transition-colors text-accent">
                  Preis berechnen
                </Link>
              </li>
              <li>
                <Link href={routes.impressum} className="hover:text-white transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href={routes.datenschutz} className="hover:text-white transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
            <p className="text-xs text-accent mt-3 font-medium">{siteConfig.serviceArea.noTravelFeeLabel}</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. Alle Rechte vorbehalten.</p>
          <p className="text-white/50">Fensterreinigung {siteConfig.contact.region}</p>
        </div>
      </div>
    </footer>
  );
}
