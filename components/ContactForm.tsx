"use client";

import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { Button, PhoneIcon, WhatsAppIcon } from "@/components/ui/Button";
import { useState } from "react";

interface ContactFormProps {
  compact?: boolean;
}

export function ContactForm({ compact = false }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

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

      // Google Ads Conversion Tracking hier einfügen:
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', 'conversion', { send_to: 'AW-XXXXX/XXXXX' });
      // }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
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
          Ihre Anfrage wurde gesendet. Wir melden uns innerhalb von{" "}
          {siteConfig.business.responseTime} bei Ihnen mit einem kostenlosen Angebot.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="">Bitte wählen...</option>
          <option value="privat">Privatfenster</option>
          <option value="gewerbe">Gewerbefenster</option>
          <option value="rahmen">Rahmen & Falz</option>
          <option value="solar">Solaranlagen</option>
          <option value="fassade">Glasfassade</option>
          <option value="wartung">Wartungsvertrag</option>
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
          placeholder="z.B. Anzahl Fenster, Stockwerk, gewünschter Termin..."
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
            <a href={`tel:${siteConfig.contact.phone}`} className="font-semibold underline">
              {siteConfig.contact.phoneDisplay}
            </a>
          </p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full">
        {loading ? "Wird gesendet..." : "Kostenloses Angebot anfordern"}
      </Button>

      {!compact && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            href={`tel:${siteConfig.contact.phone}`}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            <PhoneIcon />
            Jetzt anrufen
          </Button>
          <Button
            href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Hallo,%20ich%20möchte%20ein%20Angebot%20für%20Fensterreinigung%20anfordern.`}
            variant="whatsapp"
            size="md"
            className="flex-1"
          >
            <WhatsAppIcon />
            WhatsApp
          </Button>
        </div>
      )}
    </form>
  );
}
