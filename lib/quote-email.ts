import { siteConfig } from "@/lib/config";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  buildButton,
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";
import {
  buildQuoteContactRows,
  buildQuoteTableRows,
  getQuoteContactName,
  getQuotePlzOrt,
  getServicesLabel,
} from "@/lib/quote-summary";
import type { PricingOverrides } from "@/lib/pricing-config";

function cleanPhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/^0/, "49").replace(/^\+/, "");
}

function buildReplyBody(name: string, services: string, price: string) {
  return [
    `Guten Tag ${name},`,
    "",
    "vielen Dank für Ihre Anfrage bei Ilyashan Fensterreinigung.",
    "",
    `Angefragte Leistung: ${services}`,
    `Ihr Festpreis-Angebot: ${price || "___ €"}`,
    "Vorgeschlagener Termin: ___________",
    "",
    "Bei Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung.",
    "",
    "Mit freundlichen Grüßen",
    "Ilyashan Fensterreinigung",
    siteConfig.contact.phoneDisplay,
    siteConfig.contact.email,
  ].join("\n");
}

export function buildQuoteAdminEmail(
  data: QuoteFormData,
  anfrageNr: string,
  photoCount = 0,
  pricingOverrides?: PricingOverrides
) {
  const name = getQuoteContactName(data);
  const plzOrt = getQuotePlzOrt(data);
  const services = getServicesLabel(data);
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const phoneClean = cleanPhone(data.phone);
  const priceRow = buildQuoteTableRows(data, anfrageNr, pricingOverrides).find(
    ([k]) => k === siteConfig.messaging.priceEstimateRowLabel
  );
  const price = priceRow?.[1] ?? "";

  const whatsappText = encodeURIComponent(
    `Guten Tag ${name}, vielen Dank für Ihre Anfrage (${services}). Ihr Festpreis-Angebot: ${price || "folgt"}. Freundliche Grüße – Ilyashan Fensterreinigung`
  );
  const mailtoReply = data.email
    ? `mailto:${data.email}?subject=${encodeURIComponent(`Ihr Angebot ${anfrageNr} – Ilyashan Fensterreinigung`)}&body=${encodeURIComponent(buildReplyBody(name, services, price))}`
    : null;

  const detailRows = buildQuoteTableRows(data, anfrageNr, pricingOverrides);

  const body = `
    ${buildInfoBox(`<strong>Neue Angebotsanfrage</strong> · ${escapeHtml(anfrageNr)} · ${escapeHtml(timestamp)}`)}
    ${buildDataTable(buildQuoteContactRows(data))}
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Anfragedetails</p>
    ${buildDataTable(detailRows)}
    <p style="margin:12px 0 0;font-size:12px;color:#64748b;">PDF-Eingangsbestätigung ist als Anhang beigefügt.${photoCount > 0 ? ` ${photoCount} Foto(s) im Anhang.` : ""}</p>
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Schnellantwort</p>
    <div>
      ${buildButton(`tel:${data.phone}`, "Anrufen", "#0369a1")}
      ${buildButton(`https://wa.me/${phoneClean}?text=${whatsappText}`, "WhatsApp", "#25D366")}
      ${mailtoReply ? buildButton(mailtoReply, "Angebot senden", "#059669") : ""}
    </div>`;

  const text = ["NEUE ANGEBOTSANFRAGE – ilyashan.de", "", `Anfrage-Nr.: ${anfrageNr}`, ...detailRows.map(([k, v]) => `${k}: ${v}`), photoCount > 0 ? `Fotos: ${photoCount}` : "", "", `Eingegangen: ${timestamp}`].filter(Boolean).join("\n");

  return {
    subject: `Neue Anfrage ${anfrageNr}: ${name} – ${services} (${plzOrt})`,
    text,
    html: buildEmailLayout({
      preheader: `Neue Anfrage ${anfrageNr} von ${name}`,
      title: "Neue Angebotsanfrage",
      subtitle: `${anfrageNr} · ${name} · ${plzOrt}`,
      body,
    }),
    replyTo: data.email || undefined,
  };
}

export function buildQuoteCustomerEmail(
  data: QuoteFormData,
  anfrageNr: string,
  pricingOverrides?: PricingOverrides
) {
  const name = getQuoteContactName(data);
  const firstName = data.firstName || name.split(" ")[0];
  const detailRows = buildQuoteTableRows(data, anfrageNr, pricingOverrides).filter(
    ([k]) => k !== siteConfig.messaging.priceEstimateRowLabel
  );
  const priceRow = buildQuoteTableRows(data, anfrageNr, pricingOverrides).find(
    ([k]) => k === siteConfig.messaging.priceEstimateRowLabel
  );

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      vielen Dank für Ihre Anfrage bei <strong>Ilyashan Fensterreinigung</strong>.
      Wir haben Ihre Angaben erhalten (<strong>${escapeHtml(anfrageNr)}</strong>) und bearbeiten diese umgehend.
    </p>
    ${buildInfoBox(
      siteConfig.messaging.emailFollowUp.replace(
        "24 Stunden",
        siteConfig.business.responseTime
      )
    )}
    ${priceRow ? buildInfoBox(`${siteConfig.messaging.priceEstimateEmailLabel}: <strong>${escapeHtml(priceRow[1])}</strong>`) : ""}
    <p style="margin:20px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Anfrage im Überblick</p>
    ${buildDataTable(detailRows)}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      Im Anhang finden Sie Ihre <strong>Eingangsbestätigung als PDF</strong> – zum Ausdrucken oder Archivieren.
    </p>
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Vorteile</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${siteConfig.messaging.emailBullets
        .map(
          (item) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#334155;line-height:1.5;">
          <span style="color:#059669;font-weight:700;margin-right:8px;">&#10003;</span>${escapeHtml(item)}
        </td>
      </tr>`
        )
        .join("")}
    </table>
    <p style="margin:28px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      Bei dringenden Fragen erreichen Sie uns unter
      <a href="tel:${siteConfig.contact.phone}" style="color:#0369a1;text-decoration:none;font-weight:600;">${escapeHtml(siteConfig.contact.phoneDisplay)}</a>
      oder per
      <a href="https://wa.me/${siteConfig.contact.whatsapp}" style="color:#0369a1;text-decoration:none;font-weight:600;">WhatsApp</a>.
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.7;">
      Mit freundlichen Grüßen<br>
      <strong>Ihr Team von Ilyashan Fensterreinigung</strong>
    </p>`;

  const text = [
    `Guten Tag ${firstName},`,
    "",
    `vielen Dank für Ihre Anfrage (${anfrageNr}).`,
    "Wir melden uns innerhalb von 24 Stunden mit Ihrem verbindlichen Festpreis-Angebot.",
    "",
    ...detailRows.map(([k, v]) => `${k}: ${v}`),
    priceRow ? `${siteConfig.messaging.priceEstimateRowLabel}: ${priceRow[1]}` : "",
    "",
    "Mit freundlichen Grüßen",
    siteConfig.name,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Ihre Anfrage ${anfrageNr} – Ilyashan Fensterreinigung`,
    text,
    html: buildEmailLayout({
      preheader: `Ihre Eingangsbestätigung ${anfrageNr} – PDF im Anhang`,
      title: "Vielen Dank für Ihre Anfrage",
      subtitle: `${anfrageNr} · Eingangsbestätigung mit PDF-Anhang`,
      body,
    }),
  };
}
