"use client";

import { useEffect, useRef, useState } from "react";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import {
  canProceedQuoteStep,
  normalizeServices,
  syncObjectTypeWithService,
  validateQuoteStep,
} from "@/lib/quote-validation";
import { applyConciergePrefillToWizard } from "@/lib/concierge/wizard-bridge";
import { QuoteProgress } from "@/components/quote/QuoteProgress";
import { scrollToQuoteWizardTop } from "@/components/quote/quote-wizard-scroll";
import { Step1Services } from "@/components/quote/steps/Step1Services";
import { Step2Object } from "@/components/quote/steps/Step2Object";
import { Step3Details } from "@/components/quote/steps/Step3Details";
import { Step4Schedule } from "@/components/quote/steps/Step4Schedule";
import { Step5Contact } from "@/components/quote/steps/Step5Contact";
import { Button } from "@/components/ui/Button";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

const TOTAL_STEPS = 5;

export function QuoteWizard() {
  const wizardAnchorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuoteFormData>(initialQuoteFormData);
  const [prefillBanner, setPrefillBanner] = useState(false);

  useEffect(() => {
    const applied = applyConciergePrefillToWizard();
    if (!applied) return;
    setData(applied.data);
    setStep(applied.step);
    if (applied.fromConcierge) setPrefillBanner(true);
  }, []);

  useEffect(() => {
    scrollToQuoteWizardTop(wizardAnchorRef.current);
  }, [step]);

  function updateData(updates: Partial<QuoteFormData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function handleServicesChange(services: QuoteFormData["services"]) {
    const normalized = normalizeServices(services);
    updateData({
      services: normalized,
      objectType: syncObjectTypeWithService(normalized, data.objectType),
    });
  }

  function canProceed() {
    return canProceedQuoteStep(step, data);
  }

  function nextStep() {
    if (!canProceed() || step >= TOTAL_STEPS) return;
    setStep((current) => current + 1);
  }

  function prevStep() {
    setStep((current) => (current > 1 ? current - 1 : current));
  }

  const stepIssues = canProceed() ? [] : validateQuoteStep(step, data);

  return (
    <div ref={wizardAnchorRef} id="quote-wizard" className="scroll-mt-24">
      {prefillBanner && (
        <div
          data-testid="wizard-prefill-banner"
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-foreground/90 leading-relaxed"
        >
          <strong className="text-emerald-800">Angaben aus Assistent übernommen</strong>
          <p className="mt-1">
            Ihre bisherigen Eingaben aus dem Chat wurden übernommen. Prüfen Sie die Angaben und
            schließen Sie die Anfrage ab.
          </p>
        </div>
      )}
      <QuoteProgress currentStep={step} />

      {step === 1 && <Step1Services data={data} onChange={handleServicesChange} />}

      {step === 2 && <Step2Object data={data} onChange={updateData} />}

      {step === 3 && <Step3Details data={data} onChange={updateData} />}

      {step === 4 && <Step4Schedule data={data} onChange={updateData} />}

      {step === 5 && <Step5Contact data={data} onChange={updateData} />}

      {!canProceed() && stepIssues.length > 0 && step < 5 && (
        <p
          data-testid="quote-step-error"
          className="mt-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
        >
          {stepIssues[0].message}
        </p>
      )}

      {step < 5 && (
        <div className="flex gap-4 mt-10 pt-6 border-t border-border">
          {step > 1 ? (
            <Button type="button" variant="secondary" size="lg" onMouseDown={preventChoiceButtonScroll} onClick={prevStep} className="flex-1">
              ← Zurück
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            onMouseDown={preventChoiceButtonScroll}
            onClick={nextStep}
            disabled={!canProceed()}
            data-testid="quote-next"
            className={`flex-1 ${!canProceed() ? "opacity-50" : ""}`}
          >
            Weiter →
          </Button>
        </div>
      )}

      {step === 5 && step > 1 && (
        <div className="mt-6">
          <Button type="button" variant="secondary" size="md" onClick={prevStep}>
            ← Zurück
          </Button>
        </div>
      )}
    </div>
  );
}
