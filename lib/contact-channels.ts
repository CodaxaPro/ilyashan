import { siteConfig } from "@/lib/config";

/** Kurumsal iletişim hiyerarşisi: Anfrage (Form) → WhatsApp → Telefon (yedek). */

export const DEFAULT_WHATSAPP_PREFILL =
  "Guten Tag, ich möchte ein Angebot für eine Reinigung anfragen. Bitte melden Sie sich.";

export function buildWhatsAppUrl(text: string = DEFAULT_WHATSAPP_PREFILL): string {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function contactReachabilityLine(): string {
  const hours = siteConfig.contact.hoursLine;
  const response = siteConfig.business.responseTime;
  return `${hours} · Schriftliche Anfragen: Antwort in der Regel innerhalb von ${response}.`;
}
