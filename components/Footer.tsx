import { BrandLogo } from "@/components/BrandLogo";
import { siteConfig } from "@/lib/config";
import { companyServices } from "@/lib/company-services";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { PhoneIcon } from "@/components/ui/Button";

export function Footer() {
  return (
    <footer className="bg-primary text-white/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <BrandLogo size="footer" className="rounded-sm bg-white p-1" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Reinigung in Baesweiler, Aachen und Umgebung. Festpreis. Kein Anfahrtszuschlag.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-white">Leistungen</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {companyServices.map((service) => (
              <li key={service.href}>
                <Link href={service.href} className="hover:text-white">
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium text-white">Kontakt</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`tel:${siteConfig.contact.phone}`} className="inline-flex items-center gap-2 hover:text-white">
                <PhoneIcon className="h-4 w-4" />
                {siteConfig.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              {siteConfig.contact.address}
              <br />
              {siteConfig.contact.postalCode} {siteConfig.contact.city}
            </li>
            <li className="pt-3">
              <Link href="/de/gutschein" className="hover:text-white">
                Gutschein
              </Link>
            </li>
            <li>
              <Link href={routes.impressum} className="hover:text-white">
                Impressum
              </Link>
            </li>
            <li>
              <Link href={routes.datenschutz} className="hover:text-white">
                Datenschutz
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-sm text-white/50 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Ilyashan</p>
      </div>
    </footer>
  );
}
