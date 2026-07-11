"use client";

import type { QuoteFormData, PreferredTimeSlot, PreferredWeekday } from "@/lib/quote-form";
import {
  preferredTimeSlotLabels,
  preferredWeekdayLabels,
} from "@/lib/quote-form";
import { formatEuro, calculatePriceEstimate } from "@/lib/pricing";
import { usePricingConfig } from "@/components/quote/PricingConfigProvider";
import {
  filterWartungPackagesForAudience,
  formatWartungBadgeDe,
  getWartungAudience,
  type WartungPackage,
  type WartungPackageId,
} from "@/lib/wartung-packages";
import { compareWartungPackages } from "@/lib/wartung-pricing";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

interface WartungPlanSelectorProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

const WEEKDAYS = ["mo", "di", "mi", "do", "fr", "sa"] as const satisfies readonly Exclude<
  PreferredWeekday,
  ""
>[];
const TIME_SLOTS = ["vormittag", "nachmittag", "flexibel"] as const satisfies readonly Exclude<
  PreferredTimeSlot,
  ""
>[];

export function WartungPlanSelector({ data, onChange }: WartungPlanSelectorProps) {
  const { config, pricingOverrides } = usePricingConfig();
  const audience = getWartungAudience(data.services);
  const packages = filterWartungPackagesForAudience(config.wartungPackages, audience);

  const singleVisitEstimate = calculatePriceEstimate(
    { ...data, services: data.services.filter((s) => s !== "wartung") },
    pricingOverrides
  );
  const singleVisitPrice = singleVisitEstimate?.amount ?? 0;

  const comparisons =
    singleVisitPrice > 0
      ? compareWartungPackages(singleVisitPrice, config.wartungPackages, audience)
      : [];

  const selectedComparison = comparisons.find((item) => item.packageId === data.wartungPackageId);

  function selectPackage(pkg: WartungPackage) {
    onChange({ wartungPackageId: pkg.id });
  }

  if (packages.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Für diese Leistungsart sind derzeit keine Wartungspakete verfügbar. Bitte kontaktieren Sie
        uns telefonisch.
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6" data-testid="wartung-plan-selector">
      <div>
        <h3 className="text-lg font-bold text-foreground">Ihr Wartungsplan</h3>
        <p className="text-sm text-muted mt-1">
          Wählen Sie Intervall und Wochentag – Preis und Ersparnis aktualisieren sich live.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => {
          const comparison = comparisons.find((item) => item.packageId === pkg.id);
          const selected = data.wartungPackageId === pkg.id;
          const badge = formatWartungBadgeDe(pkg.badge);

          return (
            <button
              key={pkg.id}
              type="button"
              data-testid={`wartung-package-${pkg.id}`}
              onMouseDown={preventChoiceButtonScroll}
              onClick={() => selectPackage(pkg)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                selected
                  ? "border-primary bg-primary-light/40 shadow-md"
                  : "border-border bg-white hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">{pkg.labelDe}</p>
                  <p className="text-xs text-muted mt-0.5">{pkg.subtitleDe}</p>
                </div>
                {badge && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                    {badge}
                  </span>
                )}
              </div>

              {comparison && (
                <div className="mt-4 space-y-1 text-sm">
                  <p className="font-semibold text-primary">
                    ca. {formatEuro(comparison.monthlyPrice)}/Monat
                  </p>
                  <p className="text-muted">
                    −{Math.round(comparison.discountPercent * 100)} % · {comparison.visitsPerYear}×/
                    Jahr
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    Ersparnis ca. {formatEuro(comparison.yearlySavings)}/Jahr
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedComparison && (
        <div
          className="rounded-2xl border border-primary/20 bg-primary-light/20 p-5"
          data-testid="wartung-breakdown"
        >
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
            Ihre Kalkulation ({selectedComparison.packageLabel})
          </p>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Einzel-Einsatz</dt>
              <dd className="font-semibold tabular-nums">
                {formatEuro(selectedComparison.singleVisitPrice)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Vertragsrabatt</dt>
              <dd className="font-semibold tabular-nums">
                −{Math.round(selectedComparison.discountPercent * 100)} %
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Pro Einsatz</dt>
              <dd className="font-semibold tabular-nums">
                {formatEuro(Math.round(selectedComparison.perVisitPrice))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Besuche / Jahr</dt>
              <dd className="font-semibold tabular-nums">{selectedComparison.visitsPerYear}×</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Jahrespreis</dt>
              <dd className="font-semibold tabular-nums">
                {formatEuro(Math.round(selectedComparison.yearlyTotal))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Monatspreis</dt>
              <dd className="font-bold text-primary tabular-nums">
                ca. {formatEuro(selectedComparison.monthlyPrice)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm font-semibold text-emerald-700">
            Sie sparen ca. {formatEuro(selectedComparison.yearlySavings)} pro Jahr gegenüber
            Einzelbuchungen ohne Vertrag.
          </p>
          {selectedComparison.minimumMonthlyApplied && (
            <p className="mt-2 text-xs text-amber-800">
              Mindest-Monatspreis ({formatEuro(selectedComparison.minMonthly)}) greift für dieses
              Intervall.
            </p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Bevorzugter Wochentag</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const selected = data.wartungPreferredWeekday === day;
              const disabled = day === "sa" && audience === "privat";
              if (disabled) return null;
              return (
                <button
                  key={day}
                  type="button"
                  data-testid={`wartung-weekday-${day}`}
                  disabled={disabled}
                  onMouseDown={preventChoiceButtonScroll}
                  onClick={() => onChange({ wartungPreferredWeekday: day })}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {preferredWeekdayLabels[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Zeitfenster</p>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => {
              const selected = data.wartungPreferredTimeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  data-testid={`wartung-timeslot-${slot}`}
                  onMouseDown={preventChoiceButtonScroll}
                  onClick={() => onChange({ wartungPreferredTimeSlot: slot })}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {preferredTimeSlotLabels[slot]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Mindestvertragslaufzeit: {config.wartungMinContractMonths} Monate · Kündigung nach
        Vereinbarung. Verbindliches Angebot folgt nach Prüfung Ihrer Angaben.
      </p>
    </div>
  );
}

export function pickDefaultWartungFields(
  services: QuoteFormData["services"],
  packages: WartungPackage[],
  current: Pick<
    QuoteFormData,
    "wartungPackageId" | "wartungPreferredWeekday" | "wartungPreferredTimeSlot"
  >
): Partial<QuoteFormData> {
  if (!services.includes("wartung")) {
    return {
      wartungPackageId: "",
      wartungPreferredWeekday: "",
      wartungPreferredTimeSlot: "",
    };
  }

  const audience = getWartungAudience(services);
  const available = filterWartungPackagesForAudience(packages, audience);
  const packageStillValid = available.some((pkg) => pkg.id === current.wartungPackageId);

  return {
    wartungPackageId: packageStillValid
      ? current.wartungPackageId
      : ((available.find((pkg) => pkg.badge === "popular") ?? available[0])?.id as
          | WartungPackageId
          | undefined) ?? "",
    wartungPreferredWeekday: current.wartungPreferredWeekday || "mo",
    wartungPreferredTimeSlot: current.wartungPreferredTimeSlot || "flexibel",
  };
}
