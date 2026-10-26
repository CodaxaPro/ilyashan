"use client";

import { siteConfig } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/contact-channels";
import { routes } from "@/lib/routes";
import { trackRequestQuoteConversion } from "@/lib/google-ads";
import { trackAnalytics } from "@/lib/analytics/client";
import { Button, WhatsAppIcon } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ContactFormProps {
  compact?: boolean;
  /** Preselect Art der Reinigung (company service key) */
  defaultService?: string;
}

/** Short contact form — only services without a price calculator. */
const SERVICE_OPTIONS = [
  { value: "praxisreinigung", label: "Praxisreinigung" },
  { value: "bauendreinigung", label: "Bauendreinigung" },
  { value: "renovierungsreinigung", label: "Renovierungsreinigung" },
  { value: "entruempelung", label: "Entrümpelung" },
] as const;

const CALCULATOR_REDIRECTS: Record<string, { href: string; label: string }> = {
  treppenhausreinigung: {
    href: routes.treppenhausreinigungAngebot,
    label: "Treppenhaus — Preis kalkulieren",
  },
  bueroreinigung: {
    href: routes.bueroreinigungAngebot,
    label: "Büro — Preis kalkulieren",
  },
  fensterreinigung: {
    href: routes.angebot,
    label: "Fenster — Preis kalkulieren",
  },
};

export function ContactForm({ compact = false, defaultService }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatorRedirect =
    defaultService && CALCULATOR_REDIRECTS[defaultService]
      ? CALCULATOR_REDIRECTS[defaultService]
      : null;

  useEffect(() => {
    if (calculatorRedirect) return;
    trackAnalytics("form_start", { payload: { form: "contact" } });
  }, [calculatorRedirect]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const service = String(data.service ?? "");
    if (CALCULATOR_REDIRECTS[service]) {
      setLoading(false);
      setError(
        `Bitte nutzen Sie die Preiskalkulation: ${CALCULATOR_REDIRECTS[service].label}.`
      );
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Senden fehlgeschlagen");
      }

      trackRequestQuoteConversion();
      trackAnalytics("form_submit", { payload: { form: "contact" } });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  if (calculatorRedirect) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary-light/40 px-5 py-6 text-center space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          Für diese Leistung brauchen wir Stockwerke, Turnus und eine Preisorientierung —
          bitte über die Kalkulation anfragen.
        </p>
        <Button href={calculatorRedirect.href} variant="primary" size="lg" className="w-full">
          {calculatorRedirect.label}
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Vielen Dank!</h3>
        <p className="text-muted">
          {siteConfig.messaging.submitSuccess.replace(
            "24 Stunden",
            siteConfig.business.responseTime
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <p className="text-sm text-muted leading-relaxed rounded-xl bg-primary-light/40 border border-primary/10 px-4 py-3">
          {siteConfig.messaging.legacyFormHint.replace(
            "24 Stunden",
            siteConfig.business.responseTime
          )}{" "}
          <Link href={routes.angebot} className="text-primary font-semibold hover:underline">
            {siteConfig.messaging.ctaPrimary} →
          </Link>
        </p>
      )}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className={compact ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            placeholder="Ihr Name"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Telefon *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            placeholder="0173 3828354"
          />
        </div>
      </div>

      <div className={compact ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            E-Mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            placeholder="ihre@email.de"
          />
        </div>
        <div>
          <label htmlFor="plz" className="block text-sm font-medium mb-1.5">
            PLZ / Ort *
          </label>
          <input
            type="text"
            id="plz"
            name="plz"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            placeholder="52499 Baesweiler"
          />
        </div>
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium mb-1.5">
          Art der Reinigung *
        </label>
        <select
          id="service"
          name="service"
          required
          defaultValue={defaultService ?? ""}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="">Bitte wählen...</option>
          {SERVICE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1.5">
          Nachricht (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
          placeholder="Ort, Größe, gewünschter Zeitraum…"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="privacy"
          name="privacy"
          required
          className="mt-1 rounded border-border"
        />
        <label htmlFor="privacy" className="text-xs text-muted leading-relaxed">
          Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
          <a href={routes.datenschutz} className="text-primary underline">
            Datenschutzerklärung
          </a>{" "}
          zu. *
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <p className="mt-2">
            Alternativ:{" "}
            <a href={buildWhatsAppUrl()} className="font-semibold underline">
              WhatsApp
            </a>
            {" · "}
            <a href={`tel:${siteConfig.contact.phone}`} className="underline">
              {siteConfig.contact.phoneDisplay}
            </a>
          </p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full">
        {loading ? "Wird gesendet..." : siteConfig.messaging.ctaSubmitSimple}
      </Button>

      {!compact && (
        <div className="flex flex-col gap-3 pt-2">
          <Button
            href={buildWhatsAppUrl()}
            data-analytics-id="contact-form-whatsapp"
            variant="secondary"
            size="md"
            className="w-full"
          >
            <WhatsAppIcon />
            {siteConfig.messaging.ctaWhatsApp}
          </Button>
          <p className="text-center text-sm text-muted">
            Telefon:{" "}
            <a
              href={`tel:${siteConfig.contact.phone}`}
              data-analytics-id="contact-form-phone"
              className="font-medium text-foreground/80 underline-offset-2 hover:underline"
            >
              {siteConfig.contact.phoneDisplay}
            </a>
          </p>
        </div>
      )}
    </form>
  );
}
