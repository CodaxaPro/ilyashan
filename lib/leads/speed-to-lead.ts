/**
 * Speed-to-lead — owner must reach the customer in &lt;60s when hot.
 * Fail-closed: never invent phone; only build actions from validated contact.
 */
import { siteConfig } from "@/lib/config";
import { buildButton, buildInfoBox, escapeHtml } from "@/lib/email-templates";
import { buildCustomerWhatsAppUrl, toTelHref } from "@/lib/phone-de";

export type SpeedToLeadPriority = "normal" | "hot" | "handoff" | "booked";

const PRIORITY_DE: Record<SpeedToLeadPriority, string> = {
  normal: "Neue Anfrage — bitte zeitnah melden",
  hot: "⚡ SPEED-TO-LEAD — innerhalb von 60 Sekunden anrufen",
  handoff: "🚨 MITARBEITER-ÜBERGABE — sofort persönlich übernehmen",
  booked: "✅ Termin gebucht — kurz bestätigen / Feinjustierung",
};

export function normalizePhoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** Owner opens WhatsApp chat TO the customer (not to Ilyashan). */
export function buildOwnerWhatsAppToCustomerUrl(
  customerPhone: string,
  customerName: string,
  contextLine?: string
): string | null {
  const text = [
    `Guten Tag ${customerName.split(/\s+/)[0] ?? customerName},`,
    "",
    `hier ist ${siteConfig.name}. Wir haben Ihre Anfrage erhalten.`,
    contextLine?.trim() || "Wann passt ein kurzes Gespräch für Festpreis und Termin?",
  ].join("\n");

  return buildCustomerWhatsAppUrl(customerPhone, text);
}

export function buildSpeedToLeadAdminBlock(args: {
  name: string;
  phone: string;
  priority: SpeedToLeadPriority;
}): { html: string; text: string; subjectPrefix: string } {
  const callHref = toTelHref(args.phone);
  const wa = buildOwnerWhatsAppToCustomerUrl(args.phone, args.name);
  const label = PRIORITY_DE[args.priority];

  const html = `
    ${buildInfoBox(`<strong>${escapeHtml(label)}</strong><br/>Ziel: Erstkontakt so schnell wie möglich.`)}
    <p style="margin:12px 0;display:flex;flex-wrap:wrap;gap:8px;">
      ${
        callHref
          ? buildButton(callHref, `Anrufen ${escapeHtml(args.phone)}`, "#0369a1")
          : ""
      }
      ${
        wa
          ? buildButton(wa, "WhatsApp an Kunden", "#059669")
          : ""
      }
    </p>`;

  const text = [
    label,
    `Anrufen: ${args.phone}`,
    wa ? `WhatsApp an Kunden: ${wa}` : "",
    `SLA: Erstkontakt möglichst unter 60 Sekunden (${args.priority}).`,
  ]
    .filter(Boolean)
    .join("\n");

  const subjectPrefix =
    args.priority === "handoff"
      ? "🚨 "
      : args.priority === "hot"
        ? "⚡ "
        : args.priority === "booked"
          ? "✅ "
          : "";

  return { html, text, subjectPrefix };
}
