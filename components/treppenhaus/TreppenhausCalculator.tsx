"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import {
  allowedKellerTurnus,
  calculateTreppenhausQuote,
  formatEuroFromCents,
  syncKellerTurnus,
  type DirtLevel,
  type KellerTurnus,
  type StairTurnus,
} from "@/lib/treppenhaus/pricing";
import { Button } from "@/components/ui/Button";

const STAIR_OPTIONS: { value: StairTurnus; label: string }[] = [
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Alle 14 Tage" },
  { value: "monthly", label: "Monatlich" },
];

const DIRT_OPTIONS: { value: DirtLevel; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "Übliche Nutzung" },
  { value: "medium", label: "Erhöht", hint: "Viel Verkehr, Haustiere" },
  { value: "heavy", label: "Stark", hint: "Lange vernachlässigt / Baunähe" },
];

function kellerLabel(turnus: KellerTurnus): string {
  if (turnus === "weekly") return "Wöchentlich (wie Treppenhaus)";
  if (turnus === "biweekly") return "Alle 14 Tage (wie Treppenhaus)";
  return "Monatlich";
}

export function TreppenhausCalculator() {
  const [stockwerke, setStockwerke] = useState(3);
  const [wohnungen, setWohnungen] = useState(6);
  const [stairTurnus, setStairTurnus] = useState<StairTurnus>("biweekly");
  const [dirtLevel, setDirtLevel] = useState<DirtLevel>("normal");
  const [keller, setKeller] = useState(false);
  const [kellerTurnus, setKellerTurnus] = useState<KellerTurnus>("biweekly");
  const [aufzug, setAufzug] = useState(false);
  const [glasHandlauf, setGlasHandlauf] = useState(false);

  const kellerOptions = useMemo(() => allowedKellerTurnus(stairTurnus), [stairTurnus]);

  function onStairTurnusChange(next: StairTurnus) {
    setStairTurnus(next);
    setKellerTurnus((prev) => syncKellerTurnus(next, prev));
  }

  function onKellerToggle(enabled: boolean) {
    setKeller(enabled);
    if (enabled) setKellerTurnus(syncKellerTurnus(stairTurnus, stairTurnus));
  }

  const quote = calculateTreppenhausQuote({
    stockwerke,
    wohnungen,
    stairTurnus,
    dirtLevel,
    keller,
    kellerTurnus,
    aufzug,
    glasHandlauf,
  });

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        <fieldset className="space-y-4">
          <legend className="font-serif text-xl">Objekt</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Stockwerke</span>
              <input
                type="number"
                min={1}
                max={12}
                value={stockwerke}
                onChange={(e) => setStockwerke(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Wohnungen / Parteien</span>
              <input
                type="number"
                min={1}
                max={40}
                value={wohnungen}
                onChange={(e) => setWohnungen(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-serif text-xl">Turnus Treppenhaus</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {STAIR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onStairTurnusChange(option.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  stairTurnus === option.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white hover:border-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-serif text-xl">Verschmutzung</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {DIRT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDirtLevel(option.value)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  dirtLevel === option.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white hover:border-primary"
                }`}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span
                  className={`mt-1 block text-xs ${
                    dirtLevel === option.value ? "text-white/80" : "text-muted"
                  }`}
                >
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-xl">Extras</legend>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={keller}
              onChange={(e) => onKellerToggle(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Kellerflur</span>
              <span className="mt-0.5 block text-muted">
                Turnus folgt dem Treppenhaus — monatlich immer wählbar.
              </span>
            </span>
          </label>

          {keller && (
            <div className="ml-7 grid gap-2 sm:grid-cols-2">
              {kellerOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKellerTurnus(value)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    kellerTurnus === value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-white hover:border-primary"
                  }`}
                >
                  {kellerLabel(value)}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={aufzug}
              onChange={(e) => setAufzug(e.target.checked)}
              className="mt-1"
            />
            <span className="font-medium">Aufzug (Kabine / Spiegel)</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={glasHandlauf}
              onChange={(e) => setGlasHandlauf(e.target.checked)}
              className="mt-1"
            />
            <span className="font-medium">Glasflächen / Handlauf besonders gründlich</span>
          </label>
        </fieldset>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-28 space-y-5 border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Orientierung / Monat</p>
          {quote.needsInspection ? (
            <div>
              <p className="font-serif text-2xl">Besichtigung nötig</p>
              <p className="mt-2 text-sm text-muted">
                Ab 9 Stockwerken oder 17 Wohnungen kalkulieren wir nur vor Ort.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-serif text-4xl font-medium">
                {formatEuroFromCents(quote.monthlyNetCents)}
              </p>
              <p className="mt-1 text-sm text-muted">
                netto · brutto {formatEuroFromCents(quote.monthlyGrossCents)} (19&nbsp;% MwSt.)
              </p>
            </div>
          )}

          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Treppenhaus / Gang</dt>
              <dd>{formatEuroFromCents(quote.stairVisitNetCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Einsätze Treppenhaus</dt>
              <dd>{quote.stairVisitsPerMonth}× / Monat</dd>
            </div>
            {keller && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Keller / Gang</dt>
                  <dd>{formatEuroFromCents(quote.kellerVisitNetCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Einsätze Keller</dt>
                  <dd>{quote.kellerVisitsPerMonth}× / Monat</dd>
                </div>
              </>
            )}
          </dl>

          <p className="text-xs leading-relaxed text-muted">
            Unverbindliche Indikation. Der Festpreis folgt nach Prüfung bzw. Besichtigung.
            Kein Anfahrtszuschlag in Aachen, Baesweiler und der genannten Region.
          </p>

          <div className="flex flex-col gap-2">
            <Button href={`tel:${siteConfig.contact.phone}`} variant="primary" size="lg">
              {siteConfig.contact.phoneDisplay}
            </Button>
            <Button href={`${routes.treppenhausreinigung}#anfrage`} variant="secondary" size="lg">
              Anfrage senden
            </Button>
            <Link href={routes.treppenhausreinigung} className="text-center text-sm text-muted hover:text-primary">
              Zur Leistungsseite
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
