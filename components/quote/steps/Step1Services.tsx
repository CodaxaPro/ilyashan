"use client";

import type { QuoteFormData, QuoteServiceId } from "@/lib/quote-form";
import { quoteServices } from "@/lib/quote-form";

const serviceIcons: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  building: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  calendar: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
};

interface Step1ServicesProps {
  data: QuoteFormData;
  onChange: (services: QuoteServiceId[]) => void;
}

export function Step1Services({ data, onChange }: Step1ServicesProps) {
  function toggleService(id: QuoteServiceId) {
    if (id === "wartung") {
      if (data.services.includes("wartung")) {
        onChange(data.services.filter((s) => s !== "wartung"));
      } else {
        onChange([...data.services, "wartung"]);
      }
      return;
    }

    const wartung = data.services.includes("wartung");
    const selected = data.services.includes(id);

    if (selected && wartung) {
      onChange(["wartung"]);
      return;
    }

    if (selected) {
      onChange(wartung ? ["wartung"] : []);
      return;
    }

    onChange(wartung ? [id, "wartung"] : [id]);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Welche Leistung dürfen wir für Sie ausführen?
      </h2>
      <p className="text-muted mb-8">
        Wählen Sie Ihre Hauptleistung. Wartungsvertrag optional zusätzlich buchbar – der Preis
        wird live nach NRW-Marktpreisen berechnet.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {quoteServices.map((service) => {
          const selected = data.services.includes(service.id);
          const isPrimary = service.id !== "wartung" && selected;
          return (
            <button
              key={service.id}
              type="button"
              data-testid={`service-${service.id}`}
              onClick={() => toggleService(service.id)}
              className={`group text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                selected
                  ? "border-primary bg-primary-light/40 shadow-md shadow-primary/10"
                  : "border-border bg-white hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              <div className="flex flex-col gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? "bg-primary text-white"
                      : "bg-primary-light text-primary group-hover:bg-primary group-hover:text-white"
                  }`}
                >
                  {serviceIcons[service.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-foreground">{service.title}</h3>
                    {selected && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{service.description}</p>
                  <p className="text-sm font-semibold text-primary mt-2">{service.priceHint}</p>
                  {isPrimary && (
                    <p className="text-xs text-muted mt-1">Hauptleistung</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {data.services.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide self-center">
            Ihre Auswahl:
          </span>
          {data.services.map((id) => {
            const service = quoteServices.find((s) => s.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {service?.title}
                <button
                  type="button"
                  onClick={() => toggleService(id)}
                  className="hover:text-primary-dark"
                  aria-label={`${service?.title} entfernen`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
