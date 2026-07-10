"use client";

import type { ElevatorOption, FloorLevel, ObjectType, QuoteFormData } from "@/lib/quote-form";
import {
  elevatorLabels,
  floorLevelLabels,
  objectTypeLabels,
  quoteServiceLabels,
} from "@/lib/quote-form";

interface Step2ObjectProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

function ToggleGroup<T extends string>({
  label,
  required,
  options,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === opt.value
                ? "border-primary bg-primary-light/50 text-primary"
                : "border-border bg-white text-foreground hover:border-primary/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Step2Object({ data, onChange }: Step2ObjectProps) {
  const objectOptions: { value: ObjectType; label: string }[] = (
    Object.entries(objectTypeLabels) as [ObjectType, string][]
  ).map(([value, label]) => ({ value, label }));

  const floorOptions: { value: FloorLevel; label: string }[] = (
    Object.entries(floorLevelLabels) as [FloorLevel, string][]
  ).map(([value, label]) => ({ value, label }));

  const elevatorOptions: { value: ElevatorOption; label: string }[] = (
    Object.entries(elevatorLabels) as [ElevatorOption, string][]
  ).map(([value, label]) => ({ value, label }));

  return (
    <div>
      {data.services.length > 0 && (
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Ihre Auswahl
          </p>
          <div className="flex flex-wrap gap-2">
            {data.services.map((id) => (
              <span
                key={id}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {quoteServiceLabels[id]}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-foreground mb-2">Objekt & Zugang</h2>
      <p className="text-muted mb-8">
        Etage und Aufzug fließen direkt in die Preisberechnung ein – je genauer, desto
        transparenter Ihr Festpreis.
      </p>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-8">
          <ToggleGroup
            label="Objektart"
            required
            options={objectOptions}
            value={data.objectType}
            onChange={(objectType) => onChange({ objectType })}
          />

          {data.objectType === "sonstiges" && (
            <div>
              <input
                type="text"
                value={data.objectTypeOther}
                onChange={(e) => onChange({ objectTypeOther: e.target.value })}
                placeholder="z. B. Keller, Garage, Lagerraum"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          )}

          <ToggleGroup
            label="Etage"
            required
            options={floorOptions}
            value={data.floorLevel}
            onChange={(floorLevel) => onChange({ floorLevel })}
          />

          <ToggleGroup
            label="Aufzug vorhanden?"
            required
            options={elevatorOptions}
            value={data.elevator}
            onChange={(elevator) => onChange({ elevator })}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-4">
            Zugang & Besonderheiten{" "}
            <span className="font-normal normal-case tracking-normal text-muted/80">
              (optional)
            </span>
          </p>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={data.narrowStairs}
                onChange={(e) => onChange({ narrowStairs: e.target.checked })}
                className="mt-1 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                Enge Treppe
                <span className="block text-xs text-muted font-normal mt-0.5">+15,00 € pauschal</span>
              </span>
            </label>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={data.accessTimes}
                  onChange={(e) =>
                    onChange({
                      accessTimes: e.target.checked,
                      accessTimesNote: e.target.checked ? data.accessTimesNote : "",
                    })
                  }
                  className="mt-1 rounded border-border text-primary focus:ring-primary/30"
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
                  className="mt-3 ml-7 w-[calc(100%-1.75rem)] px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={data.specialFeatures}
                  onChange={(e) =>
                    onChange({
                      specialFeatures: e.target.checked,
                      specialNotes: e.target.checked ? data.specialNotes : "",
                    })
                  }
                  className="mt-1 rounded border-border text-primary focus:ring-primary/30"
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
                  className="mt-3 ml-7 w-[calc(100%-1.75rem)] px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
                />
              )}
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-primary-light/30 border border-primary/10">
            <p className="text-sm text-primary-dark leading-relaxed">
              <strong>Preisfaktoren:</strong> Ohne Aufzug ab 1. OG +10–42 % je nach Etage.
              Mit Aufzug entfällt der Etagenzuschlag.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
