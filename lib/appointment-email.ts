import { siteConfig } from "@/lib/config";
import type { QuoteFormData } from "@/lib/quote-form";
import { formatGermanDate } from "@/lib/quote-form";
import {
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";
import {
  buildQuoteTableRows,
  getQuoteContactName,
  getServicesLabel,
} from "@/lib/quote-summary";

export function buildAppointmentConfirmationEmail(
  data: QuoteFormData,
  anfrageNr: string,
  confirmedDate: string,
  note?: string
) {
  const name = getQuoteContactName(data);
  const firstName = data.firstName || name.split(" ")[0];
  const services = getServicesLabel(data);
  const dateLabel = formatGermanDate(confirmedDate);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      wir bestätigen hiermit Ihren Termin für die <strong>Fensterreinigung</strong>
      (${escapeHtml(services)}).
    </p>
    ${buildInfoBox(`<strong>Bestätigter Termin:</strong> ${escapeHtml(dateLabel)}`)}
    ${note ? buildInfoBox(`<strong>Hinweis:</strong> ${escapeHtml(note)}`) : ""}
    <p style="margin:20px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Anfrage</p>
    ${buildDataTable(
      buildQuoteTableRows(data, anfrageNr)
        .filter(([k]) => !["Anfrage-Nr."].includes(k))
        .slice(0, 6)
    )}
    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Bitte stellen Sie sicher, dass die Fenster zugänglich sind. Bei Fragen oder Terminänderungen
      erreichen Sie uns unter
      <a href="tel:${siteConfig.contact.phone}" style="color:#0369a1;text-decoration:none;font-weight:600;">${escapeHtml(siteConfig.contact.phoneDisplay)}</a>.
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.7;">
      Mit freundlichen Grüßen<br>
      <strong>Ihr Team von Ilyashan Fensterreinigung</strong>
    </p>`;

  const text = [
    `Guten Tag ${firstName},`,
    "",
    `Ihr Termin für Fensterreinigung (${services}) ist bestätigt:`,
    dateLabel,
    note ? `Hinweis: ${note}` : "",
    "",
    `Anfrage-Nr.: ${anfrageNr}`,
    "",
    "Mit freundlichen Grüßen",
    siteConfig.name,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Terminbestätigung ${dateLabel} – ${anfrageNr}`,
    text,
    html: buildEmailLayout({
      preheader: `Ihr Termin am ${dateLabel} ist bestätigt`,
      title: "Terminbestätigung",
      subtitle: `${anfrageNr} · ${dateLabel}`,
      body,
    }),
  };
}
