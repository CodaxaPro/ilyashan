import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { PhoneIcon } from "@/components/ui/Button";

export function Footer() {
  return (
    <footer className="bg-foreground text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                I
              </div>
              <span className="font-bold text-white text-lg">{siteConfig.name}</span>
            </div>
            <p className="text-sm leading-relaxed">
              Professionelle Fensterreinigung in {siteConfig.contact.region}.
              Kein Anfahrtszuschlag – streifenfrei, versichert, zuverlässig.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Leistungen</h3>
            <ul className="space-y-2 text-sm">
              {siteConfig.services.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <a href="#leistungen" className="hover:text-white transition-colors">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Kontakt</h3>
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
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Einsatzgebiet</h3>
            <ul className="space-y-2 text-sm">
              {siteConfig.serviceArea.regions.map((region) => (
                <li key={region.name}>
                  <span className="text-white/60">{region.name}:</span>{" "}
                  {region.areas.slice(0, 3).join(", ")}
                  {region.areas.length > 3 ? " …" : ""}
                </li>
              ))}
            </ul>
            <p className="text-xs text-accent mt-3 font-medium">{siteConfig.serviceArea.noTravelFeeLabel}</p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Rechtliches</h3>
            <ul className="space-y-2 text-sm">
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
