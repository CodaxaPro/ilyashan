import Link from "next/link";

import { siteConfig } from "@/lib/config";

const lines: Record<string, string> = {
  privat: "Wohnung und Haus. Der Preis steht im Rechner.",
  gewerbe: "Büro, Praxis oder Laden. Preis nach Anzahl und Fläche.",
  rahmen: "Beidseitig, mit Rahmen, Falz und Fensterbank.",
  solar: "Kleine Anlage, bis etwa 15 Module.",
  fassade: "Glasfassade. Preis nach Aufmaß.",
  wartung: "Regelmäßig, zum Festpreis im Monat.",
};

export function ServicePackageCards() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {siteConfig.services.map((service) => (
        <Link
          key={service.id}
          href={`/fensterreinigung/${service.id}`}
          className="group flex min-h-48 flex-col border border-border bg-white p-6 transition-colors hover:border-primary"
        >
          <h3 className="font-serif text-2xl font-medium">{service.title}</h3>
          <p className="mt-2 text-sm font-medium text-primary">{service.priceFrom}</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
            {lines[service.id] ?? service.description}
          </p>
          <p className="mt-6 text-sm font-medium text-primary group-hover:underline">Weiter</p>
        </Link>
      ))}
    </div>
  );
}
