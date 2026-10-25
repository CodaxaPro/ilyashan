import { siteConfig } from "@/lib/config";
import { buildDataTable, buildEmailLayout } from "@/lib/email-templates";
import type { ConciergeSession } from "@/lib/concierge/types";
import { buildLeadSummaryRows, isHotLead } from "@/lib/concierge/lead";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import {
  buildSpeedToLeadAdminBlock,
  type SpeedToLeadPriority,
} from "@/lib/leads/speed-to-lead";

export function buildConciergeLeadAdminEmail(
  session: ConciergeSession,
  name: string,
  phone: string,
  photoCount = 0,
  ctx: QuotePricingContext = defaultQuotePricingContext(),
  priorityOverride?: SpeedToLeadPriority
) {
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const hot = isHotLead(session);
  const rows = buildLeadSummaryRows(session, ctx);
  const noteBlob = [session.salesNotes, session.quote.additionalInfo]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const handoff =
    noteBlob.includes("mitarbeiter") || noteBlob.includes("übergabe") || noteBlob.includes("handoff");
  const priority: SpeedToLeadPriority =
    priorityOverride ?? (handoff ? "handoff" : hot ? "hot" : "normal");
  const speed = buildSpeedToLeadAdminBlock({ name, phone, priority });

  const body = `
    ${speed.html}
    ${buildDataTable([
      ["Name", name],
      ["Telefon", phone],
      ["Kanal", "Website-Assistent"],
      ["Zeit", timestamp],
      ...(photoCount > 0 ? ([["Fotos", `${photoCount} im Anhang`]] as [string, string][]) : []),
      ...rows,
    ])}`;

  const text = [
    "NEUE CONCIERGE-ANFRAGE – ilyashan.de",
    speed.text,
    "",
    `Name: ${name}`,
    `Telefon: ${phone}`,
    ...(photoCount > 0 ? [`Fotos: ${photoCount}`] : []),
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Eingegangen: ${timestamp}`,
    `Ilyashan WhatsApp (Firma): https://wa.me/${siteConfig.contact.whatsapp}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${speed.subjectPrefix}Assistent-Rückruf: ${name} (${phone})`,
    text,
    html: buildEmailLayout({
      preheader: `Rückruf von ${name} — speed-to-lead`,
      title: "Neue Assistent-Anfrage",
      subtitle: priority === "handoff" ? "Mitarbeiter-Übergabe" : hot ? "Heiß · Live-Orientierung" : "Rückruf gewünscht",
      body,
    }),
  };
}
