"use client";

import { t } from "@/lib/cleaning/i18n";
import { sumFloors, sumSubAreas } from "@/lib/cleaning";
import type { CleaningCalculatorState } from "./useCleaningCalculator";

function freqLabel(state: CleaningCalculatorState) {
  return t(state.locale, `freq_${state.input.frequency}`);
}

export function CleaningSummaryContent({
  state,
  compact = false,
}: {
  state: CleaningCalculatorState;
  compact?: boolean;
}) {
  const { locale, quote, priceLabel, input, areasOk, floorsOk } = state;
  const isManual = quote.quoteStatus === "MANUAL_REVIEW_REQUIRED";

  const titleKey =
    quote.quoteStatus === "FIXED_PRICE"
      ? "fixedPrice"
      : isManual
        ? "manualReview"
        : "provisionalPrice";

  return (
    <div className={compact ? "space-y-4" : "space-y-5"} data-testid="cleaning-summary">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
          {t(locale, "summaryTitle")}
        </p>
        <h2 className="text-lg font-bold text-foreground">{t(locale, titleKey)}</h2>
      </div>

      {isManual ? (
        <p className="text-sm text-foreground/80 leading-relaxed">
          {t(locale, "manualReviewBody")}
        </p>
      ) : priceLabel ? (
        <div>
          <p
            className="text-3xl font-extrabold text-foreground leading-none"
            data-testid="cleaning-price-net"
          >
            {priceLabel.net}
          </p>
          <p className="text-sm text-foreground/60 mt-1">{t(locale, "netPerClean")}</p>
          <div className="mt-3 space-y-1 text-sm text-foreground/80">
            <div className="flex justify-between gap-3">
              <span>{t(locale, "vat")} (19 %)</span>
              <span>{priceLabel.vat}</span>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <span>{t(locale, "gross")}</span>
              <span data-testid="cleaning-price-gross">{priceLabel.gross}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="text-sm text-foreground/80 space-y-1 border-t border-border pt-4">
        <p>
          {freqLabel(state)} · {input.totalAreaM2} {t(locale, "sqm")}
        </p>
        <p>
          {t(locale, "team")}: {quote.recommendedWorkers} {t(locale, "persons")}
        </p>
        <p>
          {t(locale, "duration")}:{" "}
          {t(locale, "hoursApprox", { h: quote.estimatedOnsiteHours })}
        </p>
        <p className="text-xs text-foreground/50 pt-1">
          {areasOk && floorsOk
            ? `✓ ${sumSubAreas(input.subAreas).toFixed(0)} / ${input.totalAreaM2} ${t(locale, "sqm")} · ${t(locale, "synced")}`
            : `⚠ ${sumSubAreas(input.subAreas).toFixed(0)} / ${input.totalAreaM2} · ${sumFloors(input.floors).toFixed(0)} / ${input.totalAreaM2}`}
        </p>
      </div>

      {!compact ? (
        <details className="border-t border-border pt-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground/80 py-2">
            {t(locale, "sectionAreas")}
          </summary>
          <ul className="pb-2 space-y-1 text-foreground/70">
            <li>
              {t(locale, "sub_office")}: {input.subAreas.office} {t(locale, "sqm")}
            </li>
            <li>
              {t(locale, "floor_carpet")}: {input.floors.carpet} {t(locale, "sqm")}
            </li>
            <li>
              {t(locale, "floor_hard")}: {input.floors.hard} {t(locale, "sqm")}
            </li>
          </ul>
        </details>
      ) : null}
    </div>
  );
}
