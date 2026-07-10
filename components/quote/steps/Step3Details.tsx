"use client";

import type { CleaningSide, DirtLevel, QuoteFormData } from "@/lib/quote-form";
import {
  cleaningSideHints,
  cleaningSideLabels,
  dirtLevelHints,
  dirtLevelLabels,
  extraPriceHints,
  quoteServiceLabels,
} from "@/lib/quote-form";
import { PriceEstimateCard } from "@/components/quote/PriceEstimateCard";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

interface Step3DetailsProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  testIdPrefix,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  testIdPrefix?: string;
}) {
  function decrement() {
    onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  }

  function increment() {
    onChange(Math.min(max, Math.round((value + step) * 10) / 10));
  }

  return (
    <div>
      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      {hint && <p className="text-xs text-muted mb-3">{hint}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          onMouseDown={preventChoiceButtonScroll}
          disabled={value <= min}
          className="w-11 h-11 rounded-xl border-2 border-border bg-white text-lg font-bold hover:border-primary/30 disabled:opacity-40 transition-colors"
          aria-label="Verringern"
        >
          −
        </button>
        <div
          className="flex-1 text-center py-3 rounded-xl border-2 border-border bg-white"
          data-testid={testIdPrefix ? `${testIdPrefix}-display` : undefined}
        >
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted ml-1">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={increment}
          onMouseDown={preventChoiceButtonScroll}
          disabled={value >= max}
          aria-label="Erhöhen"
          data-testid={testIdPrefix ? `${testIdPrefix}-increase` : undefined}
          className="w-11 h-11 rounded-xl border-2 border-border bg-white text-lg font-bold hover:border-primary/30 disabled:opacity-40 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

const reinigungswünsche: {
  key: keyof Pick<
    QuoteFormData,
    | "withFrame"
    | "withFalz"
    | "windowSills"
    | "muntinWindows"
    | "oldBuildingWindows"
    | "skylights"
    | "shutters"
    | "blinds"
    | "canopy"
    | "flyScreens"
  >;
  label: string;
}[] = [
  { key: "withFrame", label: "Mit Rahmen" },
  { key: "withFalz", label: "Fugen & Falz" },
  { key: "windowSills", label: "Fensterbänke" },
  { key: "muntinWindows", label: "Sprossenfenster" },
  { key: "oldBuildingWindows", label: "Altbaufenster" },
  { key: "skylights", label: "Oberlichter / Dachfenster" },
  { key: "shutters", label: "Rollladen" },
  { key: "blinds", label: "Jalousien" },
  { key: "canopy", label: "Vordach / Glasdach" },
  { key: "flyScreens", label: "Fliegengitter" },
];

export function Step3Details({ data, onChange }: Step3DetailsProps) {
  const selectedExtras = reinigungswünsche.filter((item) => data[item.key]).length;

  return (
    <div>
      {data.services.length > 0 && (
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Ihre Auswahl
          </p>
          <div className="flex flex-wrap gap-2">
            {data.services.map((id) => (
              <span
                key={id}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {quoteServiceLabels[id]}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-foreground mb-2">Leistungsdetails</h2>
      <p className="text-muted mb-8">
        Basispreis 5,00 €/Flügel = Glas innen & außen (normal), ohne Rahmen. Multiplikatoren und
        Zuschläge werden live berechnet.
      </p>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="lg:sticky lg:top-28 mb-8 lg:mb-0">
            <PriceEstimateCard data={data} />
          </div>
        </div>

        <div className="lg:col-span-2 order-2 lg:order-1 space-y-10">
          <section className="rounded-2xl border border-border p-6 bg-card/50">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white text-sm flex items-center justify-center font-bold">
                1
              </span>
              Fenster & Raum
            </h3>

            <div className="grid sm:grid-cols-2 gap-8">
              <Stepper
                label="Anzahl Fensterflügel"
                hint="Ein Flügel = ein beweglicher Fensterteil"
                testIdPrefix="window-count"
                value={data.windowCount}
                min={1}
                max={80}
                step={1}
                onChange={(windowCount) => onChange({ windowCount })}
              />
              <Stepper
                label="Maximale Raumhöhe"
                hint="Über 3 m: +12 % · über 4 m: +25 %"
                value={data.roomHeight}
                min={2}
                max={8}
                step={0.5}
                unit="m"
                onChange={(roomHeight) => onChange({ roomHeight })}
              />
            </div>

            <div className="mt-8">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Grad der Verschmutzung<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(dirtLevelLabels) as [DirtLevel, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      data-testid={`dirt-${value}`}
                      onMouseDown={preventChoiceButtonScroll}
                      onClick={() => onChange({ dirtLevel: value })}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        data.dirtLevel === value
                          ? "border-primary bg-primary-light/50 text-primary"
                          : "border-border bg-white hover:border-primary/30"
                      }`}
                    >
                      <span className="block">{label}</span>
                      <span className="block text-xs font-normal opacity-70 mt-0.5">
                        {dirtLevelHints[value]}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border p-6 bg-card/50">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white text-sm flex items-center justify-center font-bold">
                2
              </span>
              Reinigungsumfang & Extras
              {selectedExtras > 0 && (
                <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {selectedExtras} Extras
                </span>
              )}
            </h3>

            <div className="mt-6 mb-6">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Reinigungsseiten<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(cleaningSideLabels) as [CleaningSide, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={preventChoiceButtonScroll}
                      onClick={() => onChange({ cleaningSide: value })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        data.cleaningSide === value
                          ? "border-primary bg-primary-light/50 text-primary"
                          : "border-border bg-white hover:border-primary/30"
                      }`}
                    >
                      {label}
                      <span className="ml-1.5 text-xs font-normal opacity-70">
                        {cleaningSideHints[value]}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {reinigungswünsche.map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    data[key]
                      ? "border-primary/40 bg-primary-light/30"
                      : "border-border bg-white hover:border-primary/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={data[key]}
                    onChange={(e) => onChange({ [key]: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-medium flex-1">
                    {label}
                    <span className="block text-xs text-muted font-normal">
                      {extraPriceHints[key]}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {data.canopy && (
              <div className="mt-4 ml-1">
                <Stepper
                  label="Vordach-Fläche"
                  hint="5,00 €/m² · mindestens 25 €"
                  value={data.canopySqm || 5}
                  min={1}
                  max={50}
                  step={1}
                  unit="m²"
                  onChange={(canopySqm) => onChange({ canopySqm })}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border p-6 bg-card/50">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white text-sm flex items-center justify-center font-bold">
                3
              </span>
              Zusatzleistungen
              <span className="text-xs font-normal text-muted ml-1">(optional)</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/20">
                <input
                  type="checkbox"
                  checked={data.includeSolar}
                  onChange={(e) =>
                    onChange({
                      includeSolar: e.target.checked,
                      solarSqm: e.target.checked ? Math.max(data.solarSqm, 5) : 0,
                    })
                  }
                  className="mt-1 rounded border-border text-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm">Solaranlagen-Reinigung</span>
                  <span className="block text-xs text-muted mt-0.5">2,20 €/m² · ab 99 €</span>
                </div>
              </label>
              {data.includeSolar && (
                <div className="ml-8">
                  <Stepper
                    label="Modulfläche"
                    value={data.solarSqm || 5}
                    min={5}
                    max={500}
                    step={5}
                    unit="m²"
                    onChange={(solarSqm) => onChange({ solarSqm })}
                  />
                </div>
              )}

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/20">
                <input
                  type="checkbox"
                  checked={data.includeWintergarden}
                  onChange={(e) =>
                    onChange({
                      includeWintergarden: e.target.checked,
                      wintergardenSqm: e.target.checked ? Math.max(data.wintergardenSqm, 5) : 0,
                    })
                  }
                  className="mt-1 rounded border-border text-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm">Wintergarten-Reinigung</span>
                  <span className="block text-xs text-muted mt-0.5">8,00 €/m² · ab 129 €</span>
                </div>
              </label>
              {data.includeWintergarden && (
                <div className="ml-8">
                  <Stepper
                    label="Glasfläche Wintergarten"
                    value={data.wintergardenSqm || 5}
                    min={5}
                    max={200}
                    step={5}
                    unit="m²"
                    onChange={(wintergardenSqm) => onChange({ wintergardenSqm })}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border p-6 bg-card/50">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white text-sm flex items-center justify-center font-bold">
                4
              </span>
              Zusätzliche Informationen
              <span className="text-xs font-normal text-muted ml-1">(optional)</span>
            </h3>
            <textarea
              value={data.additionalInfo}
              onChange={(e) => onChange({ additionalInfo: e.target.value })}
              placeholder="z. B. Baustaub nach Renovierung, schwer erreichbare Fenster …"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
