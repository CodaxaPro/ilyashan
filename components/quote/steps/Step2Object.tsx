"use client";

import type { ElevatorOption, FloorLevel, ObjectType, QuoteFormData } from "@/lib/quote-form";
import {
  elevatorLabels,
  floorLevelLabels,
  objectTypeLabels,
  quoteServiceLabels,
} from "@/lib/quote-form";
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";
import { formatNarrowStairsHint } from "@/lib/pricing-display";

interface Step2ObjectProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

/** Compact segmented control – corporate, touch-safe, no scroll jump */
function SegmentedControl<T extends string>({
  label,
  required,
  options,
  value,
  onChange,
  columnsClassName,
  testIdPrefix,
}: {
  label: string;
  required?: boolean;
  options: { value: T; label: string; shortLabel?: string; hint?: string }[];
  value: T | "";
  onChange: (value: T) => void;
  columnsClassName: string;
  testIdPrefix?: string;
}) {
  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <label className="block text-xs font-bold text-muted uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {selected?.hint && (
          <span className="text-[11px] text-muted truncate max-w-[55%] text-right">
            {selected.hint}
          </span>
        )}
      </div>
      <div
        role="group"
        aria-label={label}
        className={`grid ${columnsClassName} gap-1 p-1 rounded-2xl border border-border bg-slate-50/80`}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={testIdPrefix ? `${testIdPrefix}-${opt.value}` : undefined}
              aria-pressed={active}
              aria-label={opt.label}
              title={opt.label}
              onMouseDown={preventChoiceButtonScroll}
              onClick={() => onChange(opt.value)}
              className={`min-h-11 px-2 py-2 rounded-xl text-sm font-semibold border transition-colors touch-manipulation ${
                active
                  ? "border-primary bg-white text-primary shadow-sm"
                  : "border-transparent bg-transparent text-foreground/80 hover:bg-white/80 hover:text-foreground"
              }`}
            >
              <span className="block leading-tight">{opt.shortLabel ?? opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const FLOOR_SHORT: Record<FloorLevel, string> = {
  eg: "EG",
  og1: "1. OG",
  og2: "2. OG",
  og3: "3. OG",
  og4: "4. OG",
  og5plus: "5+",
  dg: "DG",
};

export function Step2Object({ data, onChange }: Step2ObjectProps) {
  const objectOptions = (Object.entries(objectTypeLabels) as [ObjectType, string][]).map(
    ([value, label]) => ({ value, label })
  );

  const floorOptions = (Object.entries(floorLevelLabels) as [FloorLevel, string][]).map(
    ([value, label]) => ({
      value,
      label,
      shortLabel: FLOOR_SHORT[value],
      hint: label,
    })
  );

  const elevatorOptions = (Object.entries(elevatorLabels) as [ElevatorOption, string][]).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <div className="min-w-0">
      {data.services.length > 0 && (
        <div className="mb-5 pb-4 border-b border-border">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Ihre Auswahl
          </p>
          <div className="flex flex-wrap gap-2">
            {data.services.map((id) => (
              <span
                key={id}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {quoteServiceLabels[id]}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Objekt & Zugang</h2>
      <p className="text-muted text-sm sm:text-base mb-5 sm:mb-6">
        Etage und Aufzug fließen direkt in die Preisberechnung ein.
      </p>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-5 lg:gap-8 items-start">
        <div className="space-y-4 min-w-0">
          <SegmentedControl
            label="Objektart"
            required
            options={objectOptions}
            value={data.objectType}
            onChange={(objectType) => onChange({ objectType })}
            columnsClassName="grid-cols-2 sm:grid-cols-4"
            testIdPrefix="object-type"
          />

          {data.objectType === "sonstiges" && (
            <input
              type="text"
              value={data.objectTypeOther}
              onChange={(e) => onChange({ objectTypeOther: e.target.value })}
              placeholder="z. B. Keller, Garage, Lagerraum"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          )}

          <SegmentedControl
            label="Etage"
            required
            options={floorOptions}
            value={data.floorLevel}
            onChange={(floorLevel) => onChange({ floorLevel })}
            columnsClassName="grid-cols-4 sm:grid-cols-7"
            testIdPrefix="floor"
          />

          <SegmentedControl
            label="Aufzug vorhanden?"
            required
            options={elevatorOptions}
            value={data.elevator}
            onChange={(elevator) => onChange({ elevator })}
            columnsClassName="grid-cols-3"
            testIdPrefix="elevator"
          />

          <p className="text-xs text-primary-dark/90 leading-relaxed rounded-xl border border-primary/15 bg-primary-light/25 px-3 py-2.5">
            <strong>Preisfaktoren:</strong> Ohne Aufzug ab 1. OG +10–42&nbsp;% je nach Etage. Mit
            Aufzug entfällt der Etagenzuschlag.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Zugang & Besonderheiten{" "}
            <span className="font-normal normal-case tracking-normal text-muted/80">
              (optional)
            </span>
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group min-h-11 touch-manipulation">
              <input
                type="checkbox"
                checked={data.narrowStairs}
                onChange={(e) => onChange({ narrowStairs: e.target.checked })}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors min-w-0">
                Enge Treppe
                <span className="block text-xs text-muted font-normal mt-0.5">
                  {formatNarrowStairsHint()}
                </span>
              </span>
            </label>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group min-h-11 touch-manipulation">
                <input
                  type="checkbox"
                  checked={data.accessTimes}
                  onChange={(e) =>
                    onChange({
                      accessTimes: e.target.checked,
                      accessTimesNote: e.target.checked ? data.accessTimesNote : "",
                    })
                  }
                  className="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Zugang nur zu bestimmten Zeiten
                </span>
              </label>
              {data.accessTimes && (
                <input
                  type="text"
                  value={data.accessTimesNote}
                  onChange={(e) => onChange({ accessTimesNote: e.target.value })}
                  placeholder="Uhrzeit angeben, z. B. Mo–Fr 9–17 Uhr"
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group min-h-11 touch-manipulation">
                <input
                  type="checkbox"
                  checked={data.specialFeatures}
                  onChange={(e) =>
                    onChange({
                      specialFeatures: e.target.checked,
                      specialNotes: e.target.checked ? data.specialNotes : "",
                    })
                  }
                  className="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Weitere Besonderheiten angeben
                </span>
              </label>
              {data.specialFeatures && (
                <textarea
                  value={data.specialNotes}
                  onChange={(e) => onChange({ specialNotes: e.target.value })}
                  placeholder="z. B. Hinterhof, schmaler Zugang, Schlüssel beim Nachbarn …"
                  rows={3}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
