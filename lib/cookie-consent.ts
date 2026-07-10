export const COOKIE_CONSENT_KEY = "ilyashan-cookie-consent";

export type CookieConsentChoice = "accepted" | "rejected";

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function setCookieConsent(choice: CookieConsentChoice) {
  localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: choice }));
}

export function hasMarketingConsent() {
  return getCookieConsent() === "accepted";
}
