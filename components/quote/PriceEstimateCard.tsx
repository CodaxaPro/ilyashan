"use client";

import type { QuoteFormData } from "@/lib/quote-form";
import {
  calculatePriceEstimate,
  formatEuro,
  formatEuroExact,
} from "@/lib/pricing";
import { siteConfig } from "@/lib/config";

interface PriceEstimateCardProps {
  data: QuoteFormData;
  compact?: boolean;
}

export function PriceEstimateCard({ data, compact = false }: PriceEstimateCardProps) {
  const estimate = calculatePriceEstimate(data);

  if (!estimate) return null;

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary-light/40 to-white p-6 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          {estimate.label}
        </p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent uppercase tracking-wide">
          Live
        </span>
      </div>

      <p className="text-4xl font-extrabold text-foreground mb-1" data-testid="price-estimate-amount">
        ca. {formatEuro(estimate.amount)}
      </p>
      <p className="text-sm text-muted mb-1" data-testid="price-estimate-range">
        Spanne {formatEuro(estimate.min)} – {formatEuro(estimate.max)}
      </p>

      {estimate.minimumApplied && (
        <p
          data-testid="price-minimum-notice"
          className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 leading-relaxed"
        >
          Berechnet: <strong>{formatEuroExact(estimate.calculatedSubtotal)}</strong> – Mindestauftrag{" "}
          <strong>{formatEuro(estimate.minimumAmount)}</strong> greift. Extras und mehr Flügel erhöhen
          den Endpreis sichtbar.
        </p>
      )}

      {!compact && estimate.breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Kalkulation (ändert sich bei jeder Auswahl)
          </p>
          <ul className="space-y-1.5" data-testid="price-breakdown">
            {estimate.breakdown.map((line, index) => (
              <li
                key={`${line.label}-${index}-${line.amount}`}
                className="flex justify-between gap-2 text-xs"
              >
                <span className="text-muted">
                  {line.label}
                  {line.detail && (
                    <span className="block text-[10px] opacity-70">{line.detail}</span>
                  )}
                </span>
                <span
                  className={`font-semibold shrink-0 tabular-nums ${line.amount < 0 ? "text-accent" : "text-foreground"}`}
                >
                  {line.amount < 0 ? "−" : "+"}
                  {formatEuroExact(Math.abs(line.amount))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        <li className="flex items-center gap-2 text-sm text-foreground">
          <span className="text-accent font-bold">✓</span>
          Kein Anfahrtszuschlag
        </li>
        <li className="flex items-center gap-2 text-sm text-foreground">
          <span className="text-accent font-bold">✓</span>
          Streifenfrei garantiert
        </li>
        <li className="flex items-center gap-2 text-sm text-foreground">
          <span className="text-accent font-bold">✓</span>
          Vollversichert
        </li>
      </ul>

      <p className="mt-4 text-xs text-muted leading-relaxed border-t border-border pt-4">
        {estimate.note}
      </p>

      <p className="mt-3 text-xs text-muted">
        Basis: 5,00 €/Flügel (i+a, normal) · {siteConfig.contact.region}
      </p>
    </div>
  );
}
