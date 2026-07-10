import { siteConfig } from "@/lib/config";

/** Full send_to from Google Ads event snippet, e.g. AW-18191480247/AbCdEfGh */
function getRequestQuoteSendTo(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO?.trim();
  if (fromEnv) return fromEnv;

  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_LABEL?.trim();
  if (label) return `${siteConfig.googleAds.tagId}/${label}`;

  const fromConfig = siteConfig.googleAds.requestQuoteSendTo?.trim();
  return fromConfig || null;
}

/**
 * Fires Google Ads conversion after a successful quote / contact submission.
 * Uses classic conversion + send_to when configured, otherwise the manual event
 * name "request_quote" from the Google Ads conversion action.
 */
export function trackRequestQuoteConversion(transactionId?: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  const payload: Record<string, string> = {};
  if (transactionId) {
    payload.transaction_id = transactionId;
  }

  const sendTo = getRequestQuoteSendTo();

  if (sendTo) {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      ...payload,
    });
    return true;
  }

  window.gtag("event", "request_quote", payload);
  return true;
}
