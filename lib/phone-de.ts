/**
 * Deutsche Telefonnummern für tel: / WhatsApp (wa.me / api.whatsapp.com).
 * Fail-closed: zu kurze Nummern → null.
 */

/** Nur Ziffern; DE-Mobil/Festnetz 0… → 49… */
export function toWhatsAppIntlDigits(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `49${digits.slice(1)}`;
  // Lokale Nummern ohne Ländervorwahl (typisch DE, ≤11 Stellen)
  if (!digits.startsWith("49") && digits.length <= 11) digits = `49${digits}`;

  // WhatsApp braucht mindestens Ländervorwahl + sinnvolle Länge
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function toTelHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.replace(/\D/g, "").length < 6) return null;
  return `tel:${cleaned}`;
}

/** Owner → Kunde WhatsApp-Chat (präfill optional). */
export function buildCustomerWhatsAppUrl(
  customerPhone: string | null | undefined,
  text: string
): string | null {
  const intl = toWhatsAppIntlDigits(customerPhone);
  if (!intl) return null;
  // api.whatsapp.com ist in Webmail/Desktop oft zuverlässiger als wa.me allein
  return `https://api.whatsapp.com/send?phone=${intl}&text=${encodeURIComponent(text)}`;
}
