"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAdsTag } from "@/components/GoogleAdsTag";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { routes } from "@/lib/routes";

export function CookieConsent() {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(getCookieConsent());
    setReady(true);

    function onChange(event: Event) {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail;
      setChoice(detail);
    }

    window.addEventListener("cookie-consent-change", onChange);
    return () => window.removeEventListener("cookie-consent-change", onChange);
  }, []);

  function decide(value: CookieConsentChoice) {
    setCookieConsent(value);
    setChoice(value);
  }

  if (!ready) return null;

  return (
    <>
      {choice === "accepted" && <GoogleAdsTag />}

      {choice === null && (
        <div
          role="dialog"
          aria-label="Cookie-Einstellungen"
          className="fixed inset-x-0 bottom-0 z-60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-2xl shadow-black/10">
            <p className="text-sm font-semibold text-foreground mb-2">Cookies & Datenschutz</p>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Wir verwenden technisch notwendige Funktionen für die Website. Mit Ihrer Zustimmung
              nutzen wir zusätzlich Google Ads (Conversion-Messung), um unsere Anzeigen zu
              verbessern. Details in der{" "}
              <Link href={routes.datenschutz} className="text-primary underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                Nur notwendige
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Akzeptieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
