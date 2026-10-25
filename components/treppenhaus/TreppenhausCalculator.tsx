"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { trackRequestQuoteConversion } from "@/lib/google-ads";
import { trackAnalytics } from "@/lib/analytics/client";
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
import { preventChoiceButtonScroll } from "@/components/quote/quote-wizard-scroll";

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

/** Large +/- controls — native number inputs are unusable on mobile. */
function QuantityStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={preventChoiceButtonScroll}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} verringern`}
          className="h-12 w-12 shrink-0 rounded-xl border border-border bg-white text-xl font-semibold hover:border-primary disabled:opacity-40 touch-manipulation"
        >
          −
        </button>
        <div
          className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl border border-border bg-white text-lg font-semibold tabular-nums"
          aria-live="polite"
        >
          {value}
        </div>
        <button
          type="button"
          onMouseDown={preventChoiceButtonScroll}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${label} erhöhen`}
          className="h-12 w-12 shrink-0 rounded-xl border border-border bg-white text-xl font-semibold hover:border-primary disabled:opacity-40 touch-manipulation"
        >
          +
        </button>
      </div>
    </div>
  );
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [anfrageNr, setAnfrageNr] = useState<string | null>(null);

  const kellerOptions = useMemo(() => allowedKellerTurnus(stairTurnus), [stairTurnus]);

  function onStairTurnusChange(next: StairTurnus) {
    setStairTurnus(next);
    setKellerTurnus((prev) => syncKellerTurnus(next, prev));
  }

  function onKellerToggle(enabled: boolean) {
    setKeller(enabled);
    if (enabled) setKellerTurnus(syncKellerTurnus(stairTurnus, stairTurnus));
  }

  const input = {
    stockwerke,
    wohnungen,
    stairTurnus,
    dirtLevel,
    keller,
    kellerTurnus,
    aufzug,
    glasHandlauf,
  };

  const quote = calculateTreppenhausQuote(input);

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/treppenhaus/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          contact: {
            name,
            email,
            phone,
            postalCode,
            city,
            street: street || undefined,
            notes: notes || undefined,
            privacyAccepted: privacy,
          },
        }),
      });
      const data = (await res.json()) as { error?: string; anfrageNr?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Senden fehlgeschlagen");
      }
      trackRequestQuoteConversion(data.anfrageNr);
      trackAnalytics("form_submit", {
        payload: { form: "treppenhaus_quote", anfrageNr: data.anfrageNr },
      });
      setAnfrageNr(data.anfrageNr ?? null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  }

  if (anfrageNr) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-primary">Anfrage gesendet</p>
        <h2 className="mt-3 font-serif text-3xl">Vielen Dank</h2>
        <p className="mt-2 text-sm text-muted">Anfrage-Nr.: {anfrageNr}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Wir haben Ihre Kalkulation erhalten. Den Festpreis nennen wir nach der Prüfung —
          in der Regel innerhalb von {siteConfig.business.responseTime}.
        </p>
        <p className="mt-6 text-lg font-medium">
          Orientierung: {formatEuroFromCents(quote.monthlyNetCents)} netto / Monat
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button href={`tel:${siteConfig.contact.phone}`} variant="primary" size="lg">
            {siteConfig.contact.phoneDisplay}
          </Button>
          <Link href={routes.treppenhausreinigung} className="text-sm text-muted hover:text-primary">
            Zur Leistungsseite
          </Link>
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        <fieldset className="space-y-4">
          <legend className="font-serif text-xl">Objekt</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuantityStepper
              label="Stockwerke"
              value={stockwerke}
              min={1}
              max={12}
              onChange={setStockwerke}
            />
            <QuantityStepper
              label="Wohnungen / Parteien"
              value={wohnungen}
              min={1}
              max={40}
              onChange={setWohnungen}
            />
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
                Ab 9 Stockwerken oder 17 Wohnungen kalkulieren wir nur vor Ort — Anfrage trotzdem
                möglich.
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

          <form className="space-y-3 border-t border-border pt-5" onSubmit={submitQuote}>
            <p className="font-serif text-lg">Kalkulation senden</p>
            <p className="text-xs leading-relaxed text-muted">
              Wie bei Büro und Fenster: Angaben + Preis gehen direkt als Anfrage an uns.
            </p>
            {(
              [
                ["Name *", name, setName, "name", "text"],
                ["E-Mail *", email, setEmail, "email", "email"],
                ["Telefon *", phone, setPhone, "phone", "tel"],
                ["PLZ *", postalCode, setPostalCode, "postalCode", "text"],
                ["Ort *", city, setCity, "city", "text"],
                ["Straße", street, setStreet, "street", "text"],
              ] as const
            ).map(([label, value, setter, auto, type]) => (
              <label key={label} className="block text-sm">
                <span className="mb-1 block font-medium">{label}</span>
                <input
                  required={!label.startsWith("Straße")}
                  type={type}
                  autoComplete={auto}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={field}
                />
              </label>
            ))}
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Notiz</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${field} resize-none`}
              />
            </label>
            <label className="flex items-start gap-2 text-xs text-muted">
              <input
                type="checkbox"
                required
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Ich stimme der Verarbeitung gemäß{" "}
                <Link href={routes.datenschutz} className="underline hover:text-primary">
                  Datenschutzerklärung
                </Link>{" "}
                zu. *
              </span>
            </label>
            {submitError ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {submitError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Wird gesendet…" : "Kalkulation verbindlich anfragen"}
            </button>
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="block text-center text-sm text-muted hover:text-primary"
            >
              Oder anrufen: {siteConfig.contact.phoneDisplay}
            </a>
          </form>
        </div>
      </aside>
    </div>
  );
}
