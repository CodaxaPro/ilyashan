import { QUOTE_STEPS } from "@/lib/quote-form";

interface QuoteProgressProps {
  currentStep: number;
}

export function QuoteProgress({ currentStep }: QuoteProgressProps) {
  const progress = ((currentStep - 1) / (QUOTE_STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-primary">
          Schritt {currentStep} von {QUOTE_STEPS.length}
        </span>
        <span className="text-sm text-muted">{QUOTE_STEPS[currentStep - 1]?.label}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="hidden sm:flex justify-between mt-3">
        {QUOTE_STEPS.map((step) => (
          <span
            key={step.id}
            className={`text-xs font-medium ${
              step.id <= currentStep ? "text-primary" : "text-muted"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
