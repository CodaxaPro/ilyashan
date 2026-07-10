"use client";

import { useState } from "react";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import {
  canProceedQuoteStep,
  normalizeServices,
  syncObjectTypeWithService,
  validateQuoteStep,
} from "@/lib/quote-validation";
import { QuoteProgress } from "@/components/quote/QuoteProgress";
import { Step1Services } from "@/components/quote/steps/Step1Services";
import { Step2Object } from "@/components/quote/steps/Step2Object";
import { Step3Details } from "@/components/quote/steps/Step3Details";
import { Step4Schedule } from "@/components/quote/steps/Step4Schedule";
import { Step5Contact } from "@/components/quote/steps/Step5Contact";
import { Button } from "@/components/ui/Button";

const TOTAL_STEPS = 5;

export function QuoteWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuoteFormData>(initialQuoteFormData);

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
    setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  const stepIssues = canProceed() ? [] : validateQuoteStep(step, data);

  return (
    <div>
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
            <Button type="button" variant="secondary" size="lg" onClick={prevStep} className="flex-1">
              ← Zurück
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
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
