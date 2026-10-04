"use client";

import { useEffect, useId, useRef, useState } from "react";
import { t } from "@/lib/cleaning/i18n";
import type {
  CleaningCondition,
  CleaningFrequency,
  UsageIntensity,
} from "@/lib/cleaning";
import {
  clampWindowScrollToDocument,
  preventChoiceButtonScroll,
  scrollElementIntoViewBelowHeader,
  scrollToQuoteWizardTop,
} from "@/components/quote/quote-wizard-scroll";
import { CleaningAccordionSection } from "./CleaningAccordionSection";
import { CheckboxRow, NumberField, SegmentedField } from "./CleaningFields";
import { CleaningSummaryContent } from "./CleaningSummaryContent";
import {
  useCleaningCalculator,
  type CleaningCalculatorState,
} from "./useCleaningCalculator";

function stepSummary(state: CleaningCalculatorState, step: number): string {
  const { input, locale } = state;
  switch (step) {
    case 1:
      return `${input.totalAreaM2} ${t(locale, "sqm")} · ${t(locale, `freq_${input.frequency}`)}`;
    case 2:
      return `${input.subAreas.office} ${t(locale, "sqm")} ${t(locale, "sub_office")}`;
    case 3:
      return `${input.floors.carpet} ${t(locale, "sqm")} ${t(locale, "floor_carpet")} · ${input.floors.hard} ${t(locale, "sqm")} ${t(locale, "floor_hard")}`;
    case 4:
      return `${input.office.workstations} ${t(locale, "desks")}`;
    case 5:
      return `${input.sanitary.toilets} ${t(locale, "toilets")}`;
    case 6:
      return input.kitchen.kitchens === 0
        ? "—"
        : `${input.kitchen.kitchens} ${t(locale, "kitchens")}`;
    case 7:
      return input.additional.stairFloors
        ? `${input.additional.stairFloors} ${t(locale, "stairs")}`
        : "—";
    default:
      return "";
  }
}

function ContactForm({ state }: { state: CleaningCalculatorState }) {
  const { locale, submitQuote, submitting, submitError } = state;
  const [company, setCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState(state.input.postalCode ?? "");
  const [city, setCity] = useState(state.input.city ?? "");
  const [notes, setNotes] = useState("");
  const [privacy, setPrivacy] = useState(false);

  const field =
    "h-11 w-full rounded-xl border border-border bg-white px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form
      className="space-y-3"
      data-testid="cleaning-contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await submitQuote({
          company,
          contactPerson,
          email,
          phone,
          street,
          postalCode,
          city,
          notes: notes || undefined,
          privacyNoticeAccepted: privacy,
        });
      }}
    >
      <h3 className="text-lg font-semibold text-foreground">{t(locale, "contactTitle")}</h3>
      {(
        [
          [t(locale, "company"), company, setCompany, "company"],
          [t(locale, "contactPerson"), contactPerson, setContactPerson, "contactPerson"],
          [t(locale, "email"), email, setEmail, "email"],
          [t(locale, "phone"), phone, setPhone, "phone"],
          [t(locale, "street"), street, setStreet, "street"],
          [t(locale, "postalCode"), postalCode, setPostalCode, "postalCode"],
          [t(locale, "city"), city, setCity, "city"],
        ] as const
      ).map(([label, value, setter, name]) => (
        <label key={name} className="block">
          <span className="text-sm font-medium text-foreground/80 mb-1.5 block">{label}</span>
          <input
            className={field}
            name={name}
            value={value}
            required={name !== "street"}
            type={name === "email" ? "email" : "text"}
            autoComplete={name === "email" ? "email" : name === "phone" ? "tel" : "organization"}
            onChange={(e) => setter(e.target.value)}
          />
        </label>
      ))}
      <label className="block">
        <span className="text-sm font-medium text-foreground/80 mb-1.5 block">
          {t(locale, "notes")}
        </span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-foreground/80">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={privacy}
          required
          onChange={(e) => setPrivacy(e.target.checked)}
        />
        <span>{t(locale, "privacyNotice")}</span>
      </label>
      {submitError ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {submitError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        data-testid="cleaning-submit"
        className="w-full min-h-12 rounded-xl bg-accent text-white font-semibold hover:bg-emerald-600 disabled:opacity-60"
      >
        {submitting ? t(locale, "submitting") : t(locale, "submit")}
      </button>
    </form>
  );
}

function MobileSheet({ state }: { state: CleaningCalculatorState }) {
  const { locale, sheetOpen, setSheetOpen, openStep, setOpenStep, priceLabel, quote } = state;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen, setSheetOpen]);

  if (!sheetOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50" data-testid="cleaning-mobile-sheet">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t(locale, "close")}
        onClick={() => setSheetOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl bg-white border border-border shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-2">
          <h2 id={titleId} className="text-base font-bold text-foreground">
            {t(locale, "summaryTitle")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="h-11 w-11 rounded-xl border border-border text-foreground"
            onClick={() => setSheetOpen(false)}
            aria-label={t(locale, "close")}
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">
          <CleaningSummaryContent state={state} />
          {openStep !== "contact" && openStep !== "success" ? (
            <button
              type="button"
              className="mt-4 w-full min-h-12 rounded-xl bg-primary text-white font-semibold"
              onClick={() => {
                setSheetOpen(false);
                setOpenStep("contact");
              }}
            >
              {t(locale, "requestQuote")}
            </button>
          ) : null}
          {!priceLabel && quote.quoteStatus === "MANUAL_REVIEW_REQUIRED" ? (
            <button
              type="button"
              className="mt-4 w-full min-h-12 rounded-xl bg-primary text-white font-semibold"
              onClick={() => {
                setSheetOpen(false);
                setOpenStep("contact");
              }}
            >
              {t(locale, "requestQuote")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CleaningCalculator() {
  const state = useCleaningCalculator();
  const { locale, openStep, setOpenStep, input, patch } = state;
  const anchorRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  // Accordion: keep the active step in view — do NOT yank to calculator top on every toggle
  // (that left users in the footer after layout collapse). Contact/success still re-anchor.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (openStep === "success" || openStep === "contact") {
      scrollToQuoteWizardTop(anchorRef.current);
      return;
    }

    if (typeof openStep === "number") {
      const header = document.getElementById(`cleaning-step-${openStep}-header`);
      scrollElementIntoViewBelowHeader(header);
      return;
    }

    // All steps closed — clamp after height collapse so footer is not parked in view.
    requestAnimationFrame(() => {
      requestAnimationFrame(clampWindowScrollToDocument);
    });
  }, [openStep]);

  const toggle = (step: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setOpenStep((current) => (current === step ? null : step));
  };

  return (
    <div
      ref={anchorRef}
      id="cleaning-calculator"
      className="scroll-mt-24 [overflow-anchor:none]"
      data-testid="cleaning-calculator"
    >
      {openStep === "success" ? (
        <div className="text-center py-10" data-testid="cleaning-success">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t(locale, "successTitle")}</h2>
          <p className="text-foreground/80 mb-4">{t(locale, "successBody")}</p>
          {state.anfrageNr ? (
            <p className="text-primary font-bold">
              {t(locale, "anfrageNr")}: {state.anfrageNr}
            </p>
          ) : null}
        </div>
      ) : (
        <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:items-start">
        <div className="space-y-3 pb-28 lg:pb-0">
          {openStep === "contact" ? (
            <div className="border border-border rounded-2xl bg-white p-4 sm:p-5">
              <button
                type="button"
                className="text-sm text-primary font-medium mb-4"
                onMouseDown={preventChoiceButtonScroll}
                onClick={() => setOpenStep(7)}
              >
                ← {t(locale, "back")}
              </button>
              <ContactForm state={state} />
            </div>
          ) : (
            <>
              <CleaningAccordionSection
                step={1}
                title={t(locale, "step1")}
                summary={stepSummary(state, 1)}
                complete={input.totalAreaM2 > 0}
                open={openStep === 1}
                onToggle={() => toggle(1)}
              >
                <NumberField
                  label={t(locale, "totalArea")}
                  value={input.totalAreaM2}
                  onChange={state.setTotalArea}
                  unit={t(locale, "sqm")}
                  testId="cleaning-total-area"
                />
                <SegmentedField<UsageIntensity>
                  label={t(locale, "usage")}
                  value={input.usageIntensity}
                  onChange={(usageIntensity) => patch((p) => ({ ...p, usageIntensity }))}
                  options={(["LOW", "NORMAL", "HIGH"] as const).map((v) => ({
                    value: v,
                    label: t(locale, `usage_${v}`),
                  }))}
                />
                <SegmentedField<CleaningCondition>
                  label={t(locale, "condition")}
                  value={input.condition}
                  onChange={(condition) => patch((p) => ({ ...p, condition }))}
                  options={(
                    ["MAINTAINED", "NORMAL", "NEGLECTED", "INITIAL_INTENSIVE"] as const
                  ).map((v) => ({ value: v, label: t(locale, `condition_${v}`) }))}
                />
                <SegmentedField<CleaningFrequency>
                  label={t(locale, "frequency")}
                  value={input.frequency}
                  onChange={(frequency) => patch((p) => ({ ...p, frequency }))}
                  options={(
                    [
                      "ONE_TIME",
                      "1_PER_WEEK",
                      "2_PER_WEEK",
                      "3_PER_WEEK",
                      "5_PER_WEEK",
                    ] as const
                  ).map((v) => ({ value: v, label: t(locale, `freq_${v}`) }))}
                />
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={2}
                title={t(locale, "step2")}
                summary={stepSummary(state, 2)}
                complete={state.areasOk}
                open={openStep === 2}
                onToggle={() => toggle(2)}
              >
                {(
                  [
                    "office",
                    "meeting",
                    "kitchen",
                    "sanitary",
                    "corridors",
                    "reception",
                    "other",
                  ] as const
                ).map((key) => (
                  <NumberField
                    key={key}
                    label={t(locale, `sub_${key}`)}
                    value={input.subAreas[key]}
                    onChange={(n) => state.updateSubArea(key, n)}
                    unit={t(locale, "sqm")}
                  />
                ))}
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={3}
                title={t(locale, "step3")}
                summary={stepSummary(state, 3)}
                complete={state.floorsOk}
                open={openStep === 3}
                onToggle={() => toggle(3)}
              >
                {(["carpet", "hard", "wet", "other"] as const).map((key) => (
                  <NumberField
                    key={key}
                    label={t(locale, `floor_${key}`)}
                    value={input.floors[key]}
                    onChange={(n) => state.updateFloor(key, n)}
                    unit={t(locale, "sqm")}
                  />
                ))}
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={4}
                title={t(locale, "step4")}
                summary={stepSummary(state, 4)}
                complete={input.office.workstations > 0}
                open={openStep === 4}
                onToggle={() => toggle(4)}
              >
                <p className="text-sm font-medium text-foreground/70">{t(locale, "standardScope")}</p>
                <NumberField
                  label={t(locale, "desks")}
                  value={input.office.workstations}
                  onChange={state.setWorkstations}
                  unit={t(locale, "unit")}
                  testId="cleaning-desks"
                />
                <NumberField
                  label={t(locale, "bins")}
                  value={input.office.officeBins}
                  onChange={state.setOfficeBins}
                  unit={t(locale, "unit")}
                />
                {!input.office.officeBinsAutoSuggested ? (
                  <button
                    type="button"
                    className="text-sm text-primary font-medium"
                    onClick={state.restoreBinsSuggestion}
                  >
                    {t(locale, "restoreBins")}
                  </button>
                ) : null}
                <NumberField
                  label={t(locale, "meetingRooms")}
                  value={input.office.meetingRooms}
                  onChange={(n) =>
                    patch((p) => ({
                      ...p,
                      office: { ...p.office, meetingRooms: Math.max(0, Math.round(n)) },
                    }))
                  }
                  unit={t(locale, "unit")}
                />
                <NumberField
                  label={t(locale, "meetingChairs")}
                  value={input.office.meetingChairs}
                  onChange={(n) =>
                    patch((p) => ({
                      ...p,
                      office: { ...p.office, meetingChairs: Math.max(0, Math.round(n)) },
                    }))
                  }
                  unit={t(locale, "unit")}
                />
                <p className="text-sm font-medium text-foreground/70 pt-2">
                  {t(locale, "extraSurfaces")}
                </p>
                <CheckboxRow
                  label={t(locale, "cabinetFronts")}
                  checked={input.office.cabinetExterior}
                  onChange={(cabinetExterior) =>
                    patch((p) => ({ ...p, office: { ...p.office, cabinetExterior } }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "shelving")}
                  checked={input.office.shelving}
                  onChange={(shelving) =>
                    patch((p) => ({ ...p, office: { ...p.office, shelving } }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "windowSills")}
                  checked={input.office.windowSills}
                  onChange={(windowSills) =>
                    patch((p) => ({ ...p, office: { ...p.office, windowSills } }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "phoneMonitor")}
                  checked={input.office.phoneMonitorExterior}
                  onChange={(phoneMonitorExterior) =>
                    patch((p) => ({ ...p, office: { ...p.office, phoneMonitorExterior } }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "whiteboards")}
                  checked={input.office.whiteboards}
                  onChange={(whiteboards) =>
                    patch((p) => ({ ...p, office: { ...p.office, whiteboards } }))
                  }
                />
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={5}
                title={t(locale, "step5")}
                summary={stepSummary(state, 5)}
                complete={input.sanitary.toilets > 0}
                open={openStep === 5}
                onToggle={() => toggle(5)}
              >
                {(
                  [
                    ["toilets", "toilets"],
                    ["urinals", "urinals"],
                    ["washbasins", "washbasins"],
                    ["mirrors", "mirrors"],
                    ["sanitaryBins", "sanitaryBins"],
                    ["showers", "showers"],
                    ["cubicles", "cubicles"],
                  ] as const
                ).map(([field, labelKey]) => (
                  <NumberField
                    key={field}
                    label={t(locale, labelKey)}
                    value={input.sanitary[field]}
                    onChange={(n) =>
                      patch((p) => ({
                        ...p,
                        sanitary: {
                          ...p.sanitary,
                          [field]: Math.max(0, Math.round(n)),
                        },
                      }))
                    }
                    unit={t(locale, "unit")}
                  />
                ))}
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={6}
                title={t(locale, "step6")}
                summary={stepSummary(state, 6)}
                complete
                open={openStep === 6}
                onToggle={() => toggle(6)}
              >
                <NumberField
                  label={t(locale, "kitchens")}
                  value={input.kitchen.kitchens}
                  onChange={(n) =>
                    patch((p) => ({
                      ...p,
                      kitchen: { ...p.kitchen, kitchens: Math.max(0, Math.round(n)) },
                    }))
                  }
                  unit={t(locale, "unit")}
                  testId="cleaning-kitchens"
                />
                {input.kitchen.kitchens > 0 ? (
                  <>
                    <NumberField
                      label={t(locale, "kitchenTables")}
                      value={input.kitchen.tables}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: { ...p.kitchen, tables: Math.max(0, Math.round(n)) },
                        }))
                      }
                    />
                    <NumberField
                      label={t(locale, "kitchenChairs")}
                      value={input.kitchen.chairs}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: { ...p.kitchen, chairs: Math.max(0, Math.round(n)) },
                        }))
                      }
                    />
                    <NumberField
                      label={t(locale, "sinks")}
                      value={input.kitchen.sinks}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: { ...p.kitchen, sinks: Math.max(0, Math.round(n)) },
                        }))
                      }
                    />
                    <NumberField
                      label={t(locale, "counters")}
                      value={input.kitchen.countertopUnits}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: {
                            ...p.kitchen,
                            countertopUnits: Math.max(0, Math.round(n)),
                          },
                        }))
                      }
                    />
                    <NumberField
                      label={t(locale, "kitchenBins")}
                      value={input.kitchen.bins}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: { ...p.kitchen, bins: Math.max(0, Math.round(n)) },
                        }))
                      }
                    />
                    <NumberField
                      label={t(locale, "appliances")}
                      value={input.kitchen.applianceExteriors}
                      onChange={(n) =>
                        patch((p) => ({
                          ...p,
                          kitchen: {
                            ...p.kitchen,
                            applianceExteriors: Math.max(0, Math.round(n)),
                          },
                        }))
                      }
                    />
                    <CheckboxRow
                      label={t(locale, "microwaveInside")}
                      checked={input.kitchen.microwaveInside}
                      onChange={(microwaveInside) =>
                        patch((p) => ({ ...p, kitchen: { ...p.kitchen, microwaveInside } }))
                      }
                    />
                    <CheckboxRow
                      label={t(locale, "fridgeInside")}
                      checked={input.kitchen.refrigeratorInside}
                      onChange={(refrigeratorInside) =>
                        patch((p) => ({
                          ...p,
                          kitchen: { ...p.kitchen, refrigeratorInside },
                        }))
                      }
                    />
                    <CheckboxRow
                      label={t(locale, "dishwasher")}
                      checked={input.kitchen.dishwasher}
                      onChange={(dishwasher) =>
                        patch((p) => ({ ...p, kitchen: { ...p.kitchen, dishwasher } }))
                      }
                    />
                    <CheckboxRow
                      label={t(locale, "cabinetFronts")}
                      checked={input.kitchen.cabinetFronts}
                      onChange={(cabinetFronts) =>
                        patch((p) => ({ ...p, kitchen: { ...p.kitchen, cabinetFronts } }))
                      }
                    />
                    <CheckboxRow
                      label={t(locale, "dishes")}
                      checked={input.kitchen.dishes}
                      onChange={(dishes) =>
                        patch((p) => ({ ...p, kitchen: { ...p.kitchen, dishes } }))
                      }
                    />
                  </>
                ) : null}
              </CleaningAccordionSection>

              <CleaningAccordionSection
                step={7}
                title={t(locale, "step7")}
                summary={stepSummary(state, 7)}
                complete
                open={openStep === 7}
                onToggle={() => toggle(7)}
              >
                <NumberField
                  label={t(locale, "stairs")}
                  value={input.additional.stairFloors}
                  onChange={(n) =>
                    patch((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        stairFloors: Math.max(0, Math.round(n)),
                      },
                    }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "elevator")}
                  checked={input.additional.elevator}
                  onChange={(elevator) =>
                    patch((p) => ({ ...p, additional: { ...p.additional, elevator } }))
                  }
                />
                <NumberField
                  label={t(locale, "glassDoors")}
                  value={input.additional.glassEntranceDoors}
                  onChange={(n) =>
                    patch((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        glassEntranceDoors: Math.max(0, Math.round(n)),
                      },
                    }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "receptionDetail")}
                  checked={input.additional.receptionDetail}
                  onChange={(receptionDetail) =>
                    patch((p) => ({
                      ...p,
                      additional: { ...p.additional, receptionDetail },
                    }))
                  }
                />
                <CheckboxRow
                  label={t(locale, "highTouch")}
                  checked={input.additional.highTouchAreas}
                  onChange={(highTouchAreas) =>
                    patch((p) => ({
                      ...p,
                      additional: { ...p.additional, highTouchAreas },
                    }))
                  }
                />
                <p className="text-xs text-foreground/50">{t(locale, "windowNote")}</p>
                <button
                  type="button"
                  data-testid="cleaning-goto-contact"
                  className="w-full min-h-12 rounded-xl bg-accent text-white font-semibold mt-2"
                  onMouseDown={preventChoiceButtonScroll}
                  onClick={() => setOpenStep("contact")}
                >
                  {t(locale, "requestQuote")}
                </button>
              </CleaningAccordionSection>
            </>
          )}

          {state.validation
            .filter((v) => v.level !== "INFO")
            .slice(0, 3)
            .map((v) => (
              <p
                key={v.code}
                className={`text-sm rounded-xl px-4 py-3 border ${
                  v.level === "BLOCKING_ERROR"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {v.messageDe}
              </p>
            ))}
        </div>

        <aside className="hidden lg:block sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-sm">
          <CleaningSummaryContent state={state} />
          {openStep !== "contact" ? (
            <button
              type="button"
              className="mt-5 w-full min-h-12 rounded-xl bg-accent text-white font-semibold"
              onMouseDown={preventChoiceButtonScroll}
              onClick={() => setOpenStep("contact")}
            >
              {t(locale, "requestQuote")}
            </button>
          ) : null}
        </aside>
      </div>

      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        data-testid="cleaning-mobile-dock"
      >
        <div className="max-w-5xl mx-auto px-4 pt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {t(locale, "provisionalPrice")}
            </p>
            <p
              className="text-xl font-extrabold text-foreground truncate"
              data-testid="cleaning-price-net-mobile"
            >
              {state.priceLabel?.net ?? "—"}
            </p>
            <p className="text-xs text-foreground/60">{t(locale, "netPerClean")}</p>
            {state.priceLabel?.monthlyNet ? (
              <p
                className="text-xs text-foreground/55 mt-0.5 truncate"
                data-testid="cleaning-price-month-net-mobile"
              >
                {state.priceLabel.monthlyNet} {t(locale, "netPerMonth")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 min-h-11 px-4 rounded-xl border border-border bg-white font-semibold text-sm"
            onClick={() => state.setSheetOpen(true)}
            data-testid="cleaning-open-sheet"
          >
            {t(locale, "overview")} ↑
          </button>
        </div>
      </div>

      <MobileSheet state={state} />
        </>
      )}
    </div>
  );
}
