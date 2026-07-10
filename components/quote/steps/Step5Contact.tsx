"use client";

import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import type { QuoteFormData } from "@/lib/quote-form";
import { getWhatsAppQuoteUrl } from "@/lib/whatsapp-quote";
import { trackRequestQuoteConversion } from "@/lib/google-ads";
import { Button, WhatsAppIcon } from "@/components/ui/Button";
import { PriceEstimateCard } from "@/components/quote/PriceEstimateCard";
import { useState } from "react";

interface Step5ContactProps {
  data: QuoteFormData;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

export function Step5Contact({ data, onChange }: Step5ContactProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [anfrageNr, setAnfrageNr] = useState<string | null>(null);

  const canSubmit =
    data.firstName &&
    data.lastName &&
    data.phone &&
    data.postalCode &&
    data.privacyAccepted;

  async function submitByEmail() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: data }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Senden fehlgeschlagen");
      trackRequestQuoteConversion(result.anfrageNr ?? undefined);
      setAnfrageNr(result.anfrageNr ?? null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Vielen Dank!</h3>
        {anfrageNr && (
          <p className="text-primary font-bold mb-2">Anfrage-Nr.: {anfrageNr}</p>
        )}
        <p className="text-muted">
          Ihre Anfrage wurde gesendet. Wir melden uns innerhalb von{" "}
          {siteConfig.business.responseTime} mit Ihrem Festpreis-Angebot.
          {data.email && (
            <> Die Eingangsbestätigung (PDF) wurde an {data.email} gesendet.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Ihre Kontaktdaten</h2>
      <p className="text-muted mb-8">
        Prüfen Sie Ihre Kalkulation und senden Sie die Anfrage – per E-Mail mit PDF oder direkt
        per WhatsApp.
      </p>

      <div className="mb-8 max-w-md">
        <PriceEstimateCard data={data} compact />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1.5">Anrede</label>
          <select
            value={data.salutation}
            onChange={(e) => onChange({ salutation: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Bitte wählen</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
            <option value="Divers">Divers</option>
          </select>
        </div>
        <div />
        <div>
          <label htmlFor="contact-firstName" className="block text-sm font-medium mb-1.5">
            Vorname *
          </label>
          <input
            id="contact-firstName"
            type="text"
            required
            data-testid="contact-firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="contact-lastName" className="block text-sm font-medium mb-1.5">
            Nachname *
          </label>
          <input
            id="contact-lastName"
            type="text"
            required
            data-testid="contact-lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium mb-1.5">
            Telefon *
          </label>
          <input
            id="contact-phone"
            type="tel"
            required
            data-testid="contact-phone"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="0173 3828354"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">E-Mail (optional)</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="ihre@email.de"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="contact-postalCode" className="block text-sm font-medium mb-1.5">
            PLZ *
          </label>
          <input
            id="contact-postalCode"
            type="text"
            required
            data-testid="contact-postalCode"
            value={data.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="contact-city" className="block text-sm font-medium mb-1.5">
            Stadt *
          </label>
          <input
            id="contact-city"
            type="text"
            required
            data-testid="contact-city"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 mb-8">
        <input
          type="checkbox"
          data-testid="contact-privacy"
          checked={data.privacyAccepted}
          onChange={(e) => onChange({ privacyAccepted: e.target.checked })}
          className="mt-1 rounded border-border"
        />
        <span className="text-xs text-muted leading-relaxed">
          Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
          <a href={routes.datenschutz} className="text-primary underline">
            Datenschutzerklärung
          </a>{" "}
          zu. *
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={submitByEmail}
        >
          {loading ? "Wird gesendet..." : "Per E-Mail senden"}
        </Button>
        <Button
          href={canSubmit ? getWhatsAppQuoteUrl(data) : undefined}
          onClick={() => {
            if (canSubmit) trackRequestQuoteConversion();
          }}
          variant="whatsapp"
          size="lg"
          className={`w-full ${!canSubmit ? "opacity-50 pointer-events-none" : ""}`}
        >
          <WhatsAppIcon />
          Per WhatsApp senden
        </Button>
      </div>

      <p className="text-xs text-muted text-center mt-4">
        E-Mail: inkl. PDF-Eingangsbestätigung · WhatsApp: ohne PDF, sofort senden
      </p>
    </div>
  );
}
