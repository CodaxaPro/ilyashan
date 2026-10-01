import { siteConfig } from "@/lib/config";
import {
  buildButton,
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";
import { formatEuroFromCents } from "@/lib/cleaning/money";
import type { CleaningQuoteSnapshot } from "@/lib/cleaning/snapshot";
import type { LeadAppointment, LeadEmailAction } from "@/lib/leads-store";
import { formatGermanDate } from "@/lib/quote-form";
import {
  buildArrivalHtmlDe,
  buildArrivalLinesDe,
  formatSchedulePreviewDe,
  resolveAppointmentTimePlan,
} from "@/lib/scheduling/appointment-times";
import { formatFestpreisEmailLine, formatFestpreisHtmlInner } from "@/lib/vat-display";

function summaryRows(snap: CleaningQuoteSnapshot): [string, string][] {
  const { input, customer } = snap;
  return [
    ["Anfrage-Nr.", snap.quoteReference],
    ["Unternehmen", snap.contact.company],
    ["Ansprechpartner", snap.contact.contactPerson],
    ["Ort", `${snap.contact.postalCode} ${snap.contact.city}`.trim()],
    ["Fläche", `${input.totalAreaM2} m²`],
    ["Frequenz", input.frequency.replace(/_/g, " ")],
    ["Team", `${customer.recommendedWorkers} Personen`],
    ["Einsatzdauer", `ca. ${customer.estimatedOnsiteHours} Std.`],
    ["Preis netto", formatEuroFromCents(customer.netCents)],
    ["Preis brutto", formatEuroFromCents(customer.grossCents)],
    ["Status", customer.quoteStatus],
  ];
}

export function buildCleaningAdminEmail(snap: CleaningQuoteSnapshot) {
  const rows = summaryRows(snap);
  const subject = `Neue Büroreinigung ${snap.quoteReference}: ${snap.contact.company} (${snap.contact.postalCode})`;
  const html = buildEmailLayout({
    preheader: subject,
    title: "Neue Büroreinigungs-Anfrage",
    subtitle: `${snap.quoteReference} · ${escapeHtml(snap.contact.company)}`,
    body: `
      ${buildInfoBox(`<strong>Büroreinigung</strong> · ${escapeHtml(snap.quoteReference)}`)}
      ${buildDataTable(rows)}
      ${
        snap.contact.notes
          ? `<p style="margin-top:16px;font-size:14px;"><strong>Notiz:</strong> ${escapeHtml(snap.contact.notes)}</p>`
          : ""
      }
    `,
  });
  const text = ["NEUE BÜROREINIGUNG", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  return {
    subject,
    html,
    text,
    replyTo: snap.contact.email,
  };
}

export function buildCleaningCustomerEmail(
  snap: CleaningQuoteSnapshot,
  terminUrl?: string | null
) {
  const rows = summaryRows(snap).filter(([k]) => k !== "Unternehmen");
  const subject = `Ihre Büroreinigungs-Anfrage ${snap.quoteReference}`;
  const html = buildEmailLayout({
    preheader: subject,
    title: "Vielen Dank für Ihre Anfrage",
    subtitle: snap.quoteReference,
    body: `
      <p style="font-size:15px;line-height:1.6;color:#334155;">
        Guten Tag ${escapeHtml(snap.contact.contactPerson)},<br/><br/>
        wir haben Ihre Angaben zur Büroreinigung erhalten
        (<strong>${escapeHtml(snap.quoteReference)}</strong>) und bearbeiten diese umgehend.
      </p>
      ${buildDataTable(rows)}
      ${
        terminUrl
          ? `${buildInfoBox("Termin online verwalten")}
             ${buildButton(terminUrl, "Termin online verwalten", "#0369a1")}`
          : ""
      }
      <p style="margin-top:24px;font-size:14px;color:#64748b;">
        Bei Fragen: ${escapeHtml(siteConfig.contact.phoneDisplay)} · ${escapeHtml(siteConfig.contact.email)}
      </p>
    `,
  });
  const text = [
    `Ihre Anfrage ${snap.quoteReference}`,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    terminUrl ? `Termin: ${terminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

function festpreisBox(festpreis?: number) {
  if (typeof festpreis !== "number" || festpreis <= 0) return "";
  return buildInfoBox(formatFestpreisHtmlInner(festpreis, "gewerbe"));
}

function festpreisText(festpreis?: number) {
  if (typeof festpreis !== "number" || festpreis <= 0) return "";
  return formatFestpreisEmailLine(festpreis, "gewerbe");
}

export function buildCleaningLeadStatusEmail(
  action: LeadEmailAction,
  snap: CleaningQuoteSnapshot,
  options: {
    confirmedDate?: string;
    previousConfirmedDate?: string;
    proposedDate?: string;
    note?: string;
    terminUrl?: string | null;
    appointment?: LeadAppointment;
    festpreis?: number;
    estimatedHours?: number;
  }
) {
  const name = snap.contact.contactPerson;
  const anfrageNr = snap.quoteReference;
  const hours = options.estimatedHours ?? snap.customer.estimatedOnsiteHours ?? 3;
  const plan = resolveAppointmentTimePlan(options.appointment, Math.round(hours * 4));
  const planForMail =
    options.appointment?.plannedStartTime || options.appointment?.preferredStartTime
      ? plan
      : {
          ...plan,
          estimatedDurationHours: hours,
        };

  if (action === "propose") {
    const date = options.proposedDate ?? "";
    const dateLabel = date ? formatGermanDate(date) : "";
    const subject = `Terminvorschlag ${dateLabel} – ${anfrageNr}`;
    const html = buildEmailLayout({
      preheader: subject,
      title: "Terminvorschlag Büroreinigung",
      subtitle: anfrageNr,
      body: `
        <p>Guten Tag ${escapeHtml(name)},</p>
        <p>wir schlagen folgenden Termin für Ihre Büroreinigung vor:</p>
        ${buildInfoBox(`<strong>${escapeHtml(formatSchedulePreviewDe(date, planForMail))}</strong>`)}
        ${options.terminUrl ? buildButton(options.terminUrl, "Termin online verwalten", "#0369a1") : ""}
        ${options.note ? `<p>${escapeHtml(options.note)}</p>` : ""}
      `,
    });
    return {
      subject,
      html,
      text: [`Terminvorschlag ${dateLabel}`, festpreisText(options.festpreis)].filter(Boolean).join("\n"),
    };
  }

  if (action === "reject") {
    const subject = `Ihre Anfrage ${anfrageNr} – Rückmeldung`;
    return {
      subject,
      html: buildEmailLayout({
        preheader: subject,
        title: "Rückmeldung zu Ihrer Anfrage",
        subtitle: anfrageNr,
        body: `<p>Guten Tag ${escapeHtml(name)},</p><p>leider können wir Ihre Büroreinigungs-Anfrage derzeit nicht annehmen.</p>${options.note ? `<p>${escapeHtml(options.note)}</p>` : ""}`,
      }),
      text: subject,
    };
  }

  if (action === "update") {
    const date = options.confirmedDate ?? "";
    const dateLabel = date ? formatGermanDate(date) : "";
    const previousLabel = options.previousConfirmedDate
      ? formatGermanDate(options.previousConfirmedDate)
      : "";
    const subject = `Terminänderung ${dateLabel} – ${anfrageNr}`;
    return {
      subject,
      html: buildEmailLayout({
        preheader: subject,
        title: "Terminänderung Büroreinigung",
        subtitle: anfrageNr,
        body: `
          <p>Guten Tag ${escapeHtml(name)},</p>
          <p>Ihr Termin wurde aktualisiert${previousLabel ? ` (vorher ${escapeHtml(previousLabel)})` : ""}:</p>
          ${buildInfoBox(buildArrivalHtmlDe(dateLabel, planForMail))}
          ${festpreisBox(options.festpreis)}
        `,
      }),
      text: [subject, ...buildArrivalLinesDe(dateLabel, planForMail), festpreisText(options.festpreis)]
        .filter(Boolean)
        .join("\n"),
    };
  }

  const date = options.confirmedDate ?? "";
  const dateLabel = date ? formatGermanDate(date) : "";
  const subject = `Terminbestätigung ${dateLabel} – ${anfrageNr}`;
  return {
    subject,
    html: buildEmailLayout({
      preheader: subject,
      title: "Terminbestätigung Büroreinigung",
      subtitle: anfrageNr,
      body: `
        <p>Guten Tag ${escapeHtml(name)},</p>
        <p>hiermit bestätigen wir Ihren Termin zur Büroreinigung:</p>
        ${buildInfoBox(buildArrivalHtmlDe(dateLabel, planForMail))}
        ${festpreisBox(options.festpreis)}
        ${options.note ? `<p>${escapeHtml(options.note)}</p>` : ""}
      `,
    }),
    text: [subject, ...buildArrivalLinesDe(dateLabel, planForMail), festpreisText(options.festpreis)]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildCleaningReminderEmail(
  snap: CleaningQuoteSnapshot,
  confirmedDate: string,
  appointment?: LeadAppointment,
  festpreis?: number
) {
  const hours = snap.customer.estimatedOnsiteHours ?? 3;
  const plan = resolveAppointmentTimePlan(appointment, Math.round(hours * 4));
  const dateLabel = formatGermanDate(confirmedDate);
  const planForMail = { ...plan, estimatedDurationHours: hours };
  const subject = `Erinnerung: Termin morgen ${dateLabel} – ${snap.quoteReference}`;
  return {
    subject,
    html: buildEmailLayout({
      preheader: subject,
      title: "Terminerinnerung Büroreinigung",
      subtitle: snap.quoteReference,
      body: `
        <p>Guten Tag ${escapeHtml(snap.contact.contactPerson)},</p>
        <p>zur Erinnerung: morgen findet Ihre Büroreinigung statt.</p>
        ${buildInfoBox(buildArrivalHtmlDe(dateLabel, planForMail))}
        ${festpreisBox(festpreis)}
      `,
    }),
    text: subject,
  };
}
