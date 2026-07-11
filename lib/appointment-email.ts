import { siteConfig } from "@/lib/config";
import type { QuoteFormData } from "@/lib/quote-form";
import { formatGermanDate } from "@/lib/quote-form";
import {
  buildButton,
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";
import type { LeadEmailAction } from "@/lib/leads-store";
import {
  buildQuoteTableRowsFromContext,
  getQuoteContactName,
  getServicesLabel,
} from "@/lib/quote-summary";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";

function quoteEmailContext(
  data: QuoteFormData,
  anfrageNr: string,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const name = getQuoteContactName(data);
  const firstName = data.firstName || name.split(" ")[0];
  const services = getServicesLabel(data);
  const summaryRows = buildQuoteTableRowsFromContext(data, anfrageNr, ctx)
    .filter(([k]) => !["Anfrage-Nr."].includes(k))
    .slice(0, 6);

  return { name, firstName, services, summaryRows };
}

function quoteSummaryBlock(
  data: QuoteFormData,
  anfrageNr: string,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const { summaryRows } = quoteEmailContext(data, anfrageNr, ctx);
  return `
    <p style="margin:20px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Anfrage</p>
    ${buildDataTable(summaryRows)}`;
}

function contactFooter() {
  return `<p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Bei Fragen erreichen Sie uns unter
      <a href="tel:${siteConfig.contact.phone}" style="color:#0369a1;text-decoration:none;font-weight:600;">${escapeHtml(siteConfig.contact.phoneDisplay)}</a>.
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.7;">
      Mit freundlichen Grüßen<br>
      <strong>Ihr Team von Ilyashan Fensterreinigung</strong>
    </p>`;
}

export function buildAppointmentConfirmationEmail(
  data: QuoteFormData,
  anfrageNr: string,
  confirmedDate: string,
  note?: string,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const { firstName, services } = quoteEmailContext(data, anfrageNr, ctx);
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
    ${quoteSummaryBlock(data, anfrageNr, ctx)}
    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Bitte stellen Sie sicher, dass die Fenster zugänglich sind. Bei Terminänderungen
      melden Sie sich bitte rechtzeitig bei uns.
    </p>
    ${contactFooter()}`;

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

export function buildAppointmentUpdateEmail(
  data: QuoteFormData,
  anfrageNr: string,
  confirmedDate: string,
  previousDate: string | undefined,
  note?: string,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const { firstName, services } = quoteEmailContext(data, anfrageNr, ctx);
  const dateLabel = formatGermanDate(confirmedDate);
  const previousLabel = previousDate ? formatGermanDate(previousDate) : null;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      wir haben Ihren Termin für die <strong>Fensterreinigung</strong>
      (${escapeHtml(services)}) aktualisiert.
    </p>
    ${previousLabel ? buildInfoBox(`<strong>Bisheriger Termin:</strong> ${escapeHtml(previousLabel)}`) : ""}
    ${buildInfoBox(`<strong>Neuer Termin:</strong> ${escapeHtml(dateLabel)}`)}
    ${note ? buildInfoBox(`<strong>Hinweis:</strong> ${escapeHtml(note)}`) : ""}
    ${quoteSummaryBlock(data, anfrageNr, ctx)}
    ${contactFooter()}`;

  const text = [
    `Guten Tag ${firstName},`,
    "",
    `Ihr Termin für Fensterreinigung (${services}) wurde geändert:`,
    previousLabel ? `Bisher: ${previousLabel}` : "",
    `Neu: ${dateLabel}`,
    note ? `Hinweis: ${note}` : "",
    "",
    `Anfrage-Nr.: ${anfrageNr}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Terminänderung ${dateLabel} – ${anfrageNr}`,
    text,
    html: buildEmailLayout({
      preheader: `Ihr Termin wurde auf ${dateLabel} geändert`,
      title: "Terminänderung",
      subtitle: `${anfrageNr} · ${dateLabel}`,
      body,
    }),
  };
}

export function buildAppointmentProposalEmail(
  data: QuoteFormData,
  anfrageNr: string,
  proposedDate: string,
  note?: string,
  ctx: QuotePricingContext = defaultQuotePricingContext(),
  terminUrl?: string | null
) {
  const { firstName, services } = quoteEmailContext(data, anfrageNr, ctx);
  const dateLabel = formatGermanDate(proposedDate);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      vielen Dank für Ihre Anfrage zur <strong>Fensterreinigung</strong>
      (${escapeHtml(services)}). Wir schlagen folgenden Termin vor:
    </p>
    ${buildInfoBox(`<strong>Vorgeschlagener Termin:</strong> ${escapeHtml(dateLabel)}`)}
    ${note ? buildInfoBox(`<strong>Hinweis:</strong> ${escapeHtml(note)}`) : ""}
    ${quoteSummaryBlock(data, anfrageNr, ctx)}
    ${
      terminUrl
        ? `<p style="margin:24px 0 12px;font-size:14px;color:#334155;line-height:1.6;">
      Sie können den Termin online bestätigen oder einen Alternativtermin wählen:
    </p>
    ${buildButton(terminUrl, "Termin online bestätigen", "#059669")}`
        : `<p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Bitte bestätigen Sie den Termin per Antwort auf diese E-Mail oder telefonisch.
    </p>`
    }
    ${contactFooter()}`;

  const text = [
    `Guten Tag ${firstName},`,
    "",
    `Wir schlagen folgenden Termin für Fensterreinigung (${services}) vor:`,
    dateLabel,
    note ? `Hinweis: ${note}` : "",
    terminUrl ? `Online bestätigen: ${terminUrl}` : "",
    "",
    `Anfrage-Nr.: ${anfrageNr}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Terminvorschlag ${dateLabel} – ${anfrageNr}`,
    text,
    html: buildEmailLayout({
      preheader: `Terminvorschlag: ${dateLabel}`,
      title: "Terminvorschlag",
      subtitle: `${anfrageNr} · ${dateLabel}`,
      body,
    }),
  };
}

export function buildLeadRejectionEmail(
  data: QuoteFormData,
  anfrageNr: string,
  note?: string,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const { firstName, services } = quoteEmailContext(data, anfrageNr, ctx);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      vielen Dank für Ihre Anfrage zur <strong>Fensterreinigung</strong>
      (${escapeHtml(services)}). Leider können wir Ihre Anfrage derzeit nicht annehmen.
    </p>
    ${note ? buildInfoBox(`<strong>Hinweis:</strong> ${escapeHtml(note)}`) : ""}
    ${quoteSummaryBlock(data, anfrageNr, ctx)}
    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Für Rückfragen oder alternative Termine erreichen Sie uns jederzeit telefonisch.
    </p>
    ${contactFooter()}`;

  const text = [
    `Guten Tag ${firstName},`,
    "",
    `Leider können wir Ihre Anfrage (${services}) derzeit nicht annehmen.`,
    note ? `Hinweis: ${note}` : "",
    "",
    `Anfrage-Nr.: ${anfrageNr}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Ihre Anfrage ${anfrageNr} – Rückmeldung`,
    text,
    html: buildEmailLayout({
      preheader: "Rückmeldung zu Ihrer Anfrage",
      title: "Rückmeldung zu Ihrer Anfrage",
      subtitle: anfrageNr,
      body,
    }),
  };
}

export function buildLeadStatusEmail(
  action: LeadEmailAction,
  data: QuoteFormData,
  anfrageNr: string,
  options: {
    confirmedDate?: string;
    previousConfirmedDate?: string;
    proposedDate?: string;
    note?: string;
    terminUrl?: string | null;
  },
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  switch (action) {
    case "confirm":
      if (!options.confirmedDate) throw new Error("confirmedDate required");
      return buildAppointmentConfirmationEmail(data, anfrageNr, options.confirmedDate, options.note, ctx);
    case "update":
      if (!options.confirmedDate) throw new Error("confirmedDate required");
      return buildAppointmentUpdateEmail(
        data,
        anfrageNr,
        options.confirmedDate,
        options.previousConfirmedDate,
        options.note,
        ctx
      );
    case "propose":
      if (!options.proposedDate) throw new Error("proposedDate required");
      return buildAppointmentProposalEmail(
        data,
        anfrageNr,
        options.proposedDate,
        options.note,
        ctx,
        options.terminUrl
      );
    case "reject":
      return buildLeadRejectionEmail(data, anfrageNr, options.note, ctx);
    default:
      throw new Error(`Unknown email action: ${action satisfies never}`);
  }
}

export function getCustomerEmailPreviewDe(
  action: LeadEmailAction,
  options: {
    confirmedDate?: string;
    previousConfirmedDate?: string;
    proposedDate?: string;
    note?: string;
  }
): string {
  switch (action) {
    case "confirm":
      return `Terminbestätigung: ${options.confirmedDate ? formatGermanDate(options.confirmedDate) : "–"}${options.note ? ` · ${options.note}` : ""}`;
    case "update":
      return `Terminänderung: ${options.previousConfirmedDate ? formatGermanDate(options.previousConfirmedDate) : "–"} → ${options.confirmedDate ? formatGermanDate(options.confirmedDate) : "–"}${options.note ? ` · ${options.note}` : ""}`;
    case "propose":
      return `Terminvorschlag: ${options.proposedDate ? formatGermanDate(options.proposedDate) : "–"}${options.note ? ` · ${options.note}` : ""}`;
    case "reject":
      return `Ablehnung${options.note ? `: ${options.note}` : ""}`;
    default:
      return "";
  }
}
