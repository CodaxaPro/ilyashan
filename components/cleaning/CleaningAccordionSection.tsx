"use client";

import type { ReactNode } from "react";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

interface AccordionSectionProps {
  step: number;
  title: string;
  summary?: string;
  complete?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CleaningAccordionSection({
  step,
  title,
  summary,
  complete,
  open,
  onToggle,
  children,
}: AccordionSectionProps) {
  const panelId = `cleaning-step-${step}-panel`;
  const headerId = `cleaning-step-${step}-header`;

  return (
    <section className="border border-border rounded-2xl bg-white overflow-hidden [overflow-anchor:none]">
      <h3>
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          onMouseDown={preventChoiceButtonScroll}
          className="w-full flex items-start gap-3 px-4 sm:px-5 py-4 text-left min-h-14 scroll-mt-24 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          data-testid={`cleaning-accordion-${step}`}
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              complete
                ? "bg-emerald-100 text-emerald-800"
                : open
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground/70"
            }`}
          >
            {complete && !open ? "✓" : step}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-foreground">{title}</span>
            {summary ? (
              <span className="block text-sm text-foreground/60 mt-0.5 truncate">{summary}</span>
            ) : null}
          </span>
        </button>
      </h3>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="px-4 sm:px-5 pb-5 border-t border-border"
        >
          <div className="pt-4 space-y-4">{children}</div>
        </div>
      ) : null}
    </section>
  );
}
