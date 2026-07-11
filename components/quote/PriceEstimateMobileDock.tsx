"use client";

import { useEffect, useState } from "react";
import type { QuoteFormData } from "@/lib/quote-form";
import { formatEuro } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";
import { PriceEstimateCard } from "@/components/quote/PriceEstimateCard";
import { useQuotePriceEstimate } from "@/components/quote/useQuotePriceEstimate";

interface PriceEstimateMobileDockProps {
  data: QuoteFormData;
}

export function PriceEstimateMobileDock({ data }: PriceEstimateMobileDockProps) {
  const estimate = useQuotePriceEstimate(data);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const priceSignature = `${data.windowCount}:${data.services.join(",")}:${data.wartungPackageId}`;

  useEffect(() => {
    setOpen(false);
  }, [priceSignature]);

  if (!estimate) return null;

  return (
    <>
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        data-testid="price-estimate-mobile-dock"
      >
        <div className="max-w-5xl mx-auto px-4 pt-3 pr-20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {estimate.label}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent uppercase">
                  Live
                </span>
              </div>
              <p
                className="text-2xl font-extrabold text-foreground leading-tight"
                data-testid="price-estimate-amount"
              >
                ca. {formatEuro(estimate.amount)}
              </p>
              <p className="text-xs text-muted truncate" data-testid="price-estimate-range">
                Spanne {formatEuro(estimate.min)} – {formatEuro(estimate.max)} · unverbindlich
              </p>
              {estimate.wartung && (
                <p
                  className="text-[11px] text-emerald-700 font-medium mt-1 truncate"
                  data-testid="wartung-summary"
                >
                  Wartung {estimate.wartung.packageLabel} · Ersparnis ca.{" "}
                  {formatEuro(estimate.wartung.yearlySavings)}/Jahr
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm"
              data-testid="price-estimate-details-open"
            >
              Details
            </button>
          </div>
          <p className="text-[10px] text-muted mt-2 leading-snug">
            Verbindliches Festpreis-Angebot in {siteConfig.business.responseTime}
          </p>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            aria-label="Schließen"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="price-estimate-sheet-title"
            className="absolute inset-x-0 bottom-0 max-h-[min(88vh,720px)] flex flex-col rounded-t-3xl bg-white shadow-2xl border-t border-border"
            data-testid="price-estimate-details-sheet"
          >
            <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
              <div className="flex items-center justify-between gap-3">
                <h3 id="price-estimate-sheet-title" className="text-base font-bold text-foreground">
                  Live-Preisschätzung
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"
                  data-testid="price-estimate-details-close"
                >
                  Schließen
                </button>
              </div>
              <p className="text-xs text-muted mt-1">
                Transparente Kalkulation – Ihr Festpreis-Angebot folgt per E-Mail.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <PriceEstimateCard data={data} sheet />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
