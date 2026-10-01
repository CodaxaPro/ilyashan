"use client";

import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  testId?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 50_000,
  step = 1,
  testId,
}: NumberFieldProps) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10));

  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground/80 mb-2 block">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={preventChoiceButtonScroll}
          onClick={dec}
          className="h-11 w-11 shrink-0 rounded-xl border border-border bg-white text-lg font-semibold text-foreground hover:bg-muted touch-manipulation"
          aria-label="-"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          data-testid={testId}
          className="h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.min(max, Math.max(min, n)));
          }}
        />
        <button
          type="button"
          onMouseDown={preventChoiceButtonScroll}
          onClick={inc}
          className="h-11 w-11 shrink-0 rounded-xl border border-border bg-white text-lg font-semibold text-foreground hover:bg-muted touch-manipulation"
          aria-label="+"
        >
          +
        </button>
        {unit ? (
          <span className="text-sm text-foreground/60 shrink-0 w-10">{unit}</span>
        ) : null}
      </div>
    </label>
  );
}

interface SegmentProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: SegmentProps<T>) {
  return (
    <fieldset data-testid={testId}>
      <legend className="text-sm font-medium text-foreground/80 mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onMouseDown={preventChoiceButtonScroll}
              onClick={() => onChange(opt.value)}
              className={`min-h-11 px-3 py-2 rounded-xl text-sm font-medium border touch-manipulation transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 min-h-11 cursor-pointer">
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
