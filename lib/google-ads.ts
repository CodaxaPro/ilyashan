import { siteConfig } from "@/lib/config";

type AdsConversionKind = "request_quote" | "whatsapp_click" | "phone_click";

/** Full send_to from Google Ads event snippet, e.g. AW-18191480247/AbCdEfGh */
function getSendTo(kind: AdsConversionKind): string | null {
  if (kind === "request_quote") {
    const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO?.trim();
    if (fromEnv) return fromEnv;

    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_LABEL?.trim();
    if (label) return `${siteConfig.googleAds.tagId}/${label}`;

    const fromConfig = siteConfig.googleAds.requestQuoteSendTo?.trim();
    return fromConfig || null;
  }

  if (kind === "whatsapp_click") {
    const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_SEND_TO?.trim();
    if (fromEnv) return fromEnv;
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL?.trim();
    if (label) return `${siteConfig.googleAds.tagId}/${label}`;
    return siteConfig.googleAds.whatsappSendTo?.trim() || null;
  }

  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_SEND_TO?.trim();
  if (fromEnv) return fromEnv;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_LABEL?.trim();
  if (label) return `${siteConfig.googleAds.tagId}/${label}`;
  return siteConfig.googleAds.phoneSendTo?.trim() || null;
}

function fireConversion(kind: AdsConversionKind, transactionId?: string): boolean {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  const payload: Record<string, string> = {};
  if (transactionId) {
    payload.transaction_id = transactionId;
  }

  const sendTo = getSendTo(kind);

  // Always emit the named event — Ads "Google Tag / Event" conversions listen by name.
  window.gtag("event", kind, payload);

  // Classic conversion snippet when send_to is configured (recommended).
  if (sendTo) {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      ...payload,
    });
  }

  return true;
}

/**
 * Primary lead: quote / contact form success (email or WhatsApp from Angebot wizard).
 */
export function trackRequestQuoteConversion(transactionId?: string) {
  return fireConversion("request_quote", transactionId);
}

/**
 * Secondary: floating / header WhatsApp open (not a filled quote).
 * Create a separate Ads conversion action named whatsapp_click.
 */
export function trackWhatsAppClickConversion(transactionId?: string) {
  return fireConversion("whatsapp_click", transactionId);
}

/**
 * Secondary: click-to-call on site (tel: links).
 * Call-asset reporting (≥60s) is separate — enable in Ads for call extensions.
 */
export function trackPhoneClickConversion(transactionId?: string) {
  return fireConversion("phone_click", transactionId);
}
