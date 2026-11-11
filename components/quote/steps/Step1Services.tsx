import { siteConfig } from "@/lib/config";
import type { QuoteFormData, QuoteServiceId } from "@/lib/quote-form";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";
import { usePricingConfig } from "@/components/quote/PricingConfigProvider";
import { WartungPlanSelector, pickDefaultWartungFields } from "@/components/quote/WartungPlanSelector";
import { ensurePrimaryService, normalizeServices } from "@/lib/quote-validation";
import { formatMinimumWohnungHint } from "@/lib/pricing-display";

interface Step1ServicesProps {
  data: QuoteFormData;
  onUpdate: (updates: Partial<QuoteFormData>) => void;
}

export function Step1Services({ data, onUpdate }: Step1ServicesProps) {
  const { config } = usePricingConfig();
  const quarterly = config.wartungPackages.find((pkg) => pkg.id === "quarterly");
  const maxDiscount = Math.round(
    Math.max(...config.wartungPackages.map((pkg) => pkg.discountPercent)) * 100
  );
  const wartungSelected = data.services.includes("wartung");
  const priceHint = formatMinimumWohnungHint(config.minimumWohnung);

  function applyServices(services: QuoteServiceId[]) {
    const normalized = normalizeServices(services);
    const wartungDefaults = pickDefaultWartungFields(normalized, config.wartungPackages, data);
    onUpdate({
      services: normalized,
      ...wartungDefaults,
    });
  }

  function toggleWartung() {
    const primary = ensurePrimaryService(data.services);
    if (wartungSelected) {
      applyServices([primary]);
      return;
    }
    applyServices([primary, "wartung"]);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Fensterreinigung – live berechnet
      </h2>
      <p className="text-muted mb-8">{siteConfig.messaging.wizardStep1Hint}</p>

      <div className="rounded-2xl border-2 border-primary/20 bg-primary-light/20 p-6 mb-4">
        <p className="font-bold text-foreground">Einmalige Fensterreinigung</p>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Privat und Gewerbe – gleicher Live-Preis pro Flügel. Objektart wählen Sie im nächsten
          Schritt. Große Scheiben: individuelle Anfrage.
        </p>
        <p className="text-sm font-semibold text-primary mt-2">{priceHint}</p>
      </div>

      <button
        type="button"
        data-testid="service-wartung"
        onMouseDown={preventChoiceButtonScroll}
        onClick={toggleWartung}
        className={`w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
          wartungSelected
            ? "border-primary bg-primary-light/40 shadow-md shadow-primary/10"
            : "border-border bg-white hover:border-primary/30 hover:shadow-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Wartungsvertrag (optional)</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              Regelmäßige Reinigung mit Rabatt – Intervall im Anschluss wählen.
            </p>
            {quarterly && (
              <p className="text-sm font-semibold text-primary mt-2">
                Live berechnet · ab {quarterly.minMonthly} €/Mo. · bis −{maxDiscount} %
              </p>
            )}
          </div>
          {wartungSelected && (
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          )}
        </div>
      </button>

      {wartungSelected && <WartungPlanSelector data={data} onChange={onUpdate} />}
    </div>
  );
}
