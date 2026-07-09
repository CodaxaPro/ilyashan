import { siteConfig } from "@/lib/config";
import {
  buildButton,
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";

const serviceLabels: Record<string, string> = {
  privat: "Privatfenster",
  gewerbe: "Gewerbefenster",
  rahmen: "Rahmen & Falz",
  solar: "Solaranlagen",
  fassade: "Glasfassade",
  wartung: "Wartungsvertrag",
};

export interface ContactEmailData {
  name: string;
  phone: string;
  email?: string;
  plz: string;
  service: string;
  message?: string;
}

function getServiceLabel(service: string) {
  return serviceLabels[service] ?? service;
}

function cleanPhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/^0/, "49").replace(/^\+/, "");
}

function buildReplyBody(name: string, serviceLabel: string) {
  return [
    `Guten Tag ${name},`,
    "",
    "vielen Dank für Ihre Anfrage bei Ilyashan Fensterreinigung.",
    "",
    `Angefragte Leistung: ${serviceLabel}`,
    "Ihr Festpreis-Angebot: ___ €",
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

export function buildAdminNotificationEmail(data: ContactEmailData) {
  const serviceLabel = getServiceLabel(data.service);
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const phoneClean = cleanPhone(data.phone);
  const replyBody = buildReplyBody(data.name, serviceLabel);
  const whatsappText = encodeURIComponent(
    `Guten Tag ${data.name}, vielen Dank für Ihre Anfrage (${serviceLabel}). Ihr Festpreis-Angebot: ___ €. Termin: ___. Freundliche Grüße – Ilyashan Fensterreinigung`
  );
  const mailtoReply = data.email
    ? `mailto:${data.email}?subject=${encodeURIComponent("Ihr Angebot – Ilyashan Fensterreinigung")}&body=${encodeURIComponent(replyBody)}`
    : null;

  const body = `
    ${buildInfoBox(`<strong>Neue Angebotsanfrage</strong> über ilyashan.de · ${escapeHtml(timestamp)}`)}
    ${buildDataTable([
      ["Name", data.name],
      ["Telefon", data.phone],
      ["E-Mail", data.email || "–"],
      ["PLZ / Ort", data.plz],
      ["Leistung", serviceLabel],
      ["Nachricht", data.message || "–"],
    ])}
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Schnellantwort</p>
  <div>
      ${buildButton(`tel:${data.phone}`, "Anrufen", "#0369a1")}
      ${buildButton(`https://wa.me/${phoneClean}?text=${whatsappText}`, "WhatsApp", "#25D366")}
      ${mailtoReply ? buildButton(mailtoReply, "Angebot senden", "#059669") : ""}
    </div>`;

  const text = [
    "NEUE ANGEBOTSANFRAGE – ilyashan.de",
    "",
    `Name: ${data.name}`,
    `Telefon: ${data.phone}`,
    `E-Mail: ${data.email || "–"}`,
    `PLZ/Ort: ${data.plz}`,
    `Leistung: ${serviceLabel}`,
    `Nachricht: ${data.message || "–"}`,
    "",
    `Eingegangen: ${timestamp}`,
  ].join("\n");

  return {
    serviceLabel,
    subject: `Neue Anfrage: ${data.name} – ${serviceLabel} (${data.plz})`,
    text,
    html: buildEmailLayout({
      preheader: `Neue Anfrage von ${data.name} – ${serviceLabel}`,
      title: "Neue Angebotsanfrage",
      subtitle: `${data.name} · ${data.plz} · ${serviceLabel}`,
      body,
    }),
    replyTo: data.email || undefined,
  };
}

export function buildCustomerConfirmationEmail(data: ContactEmailData) {
  const serviceLabel = getServiceLabel(data.service);
  const firstName = data.name.split(" ")[0];

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Guten Tag ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      vielen Dank für Ihre Anfrage bei <strong>Ilyashan Fensterreinigung</strong>.
      Wir haben Ihre Nachricht erhalten und bearbeiten diese umgehend.
    </p>
    ${buildInfoBox(
      `Wir melden uns innerhalb von <strong>${siteConfig.business.responseTime}</strong> mit einem kostenlosen, unverbindlichen Festpreis-Angebot bei Ihnen.`
    )}
  <p style="margin:20px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Anfrage im Überblick</p>
    ${buildDataTable([
      ["Leistung", serviceLabel],
      ["PLZ / Ort", data.plz],
      ["Telefon", data.phone],
      ["Nachricht", data.message || "–"],
    ])}
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ihre Vorteile</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${[
        "Kostenloses & unverbindliches Angebot",
        "Kein Anfahrtszuschlag in Baesweiler, Aachen & Umgebung",
        "Streifenfrei garantiert – vollversichert",
        "Festpreis ohne versteckte Kosten",
      ]
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
      Bei dringenden Fragen erreichen Sie uns direkt unter
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
    "vielen Dank für Ihre Anfrage bei Ilyashan Fensterreinigung.",
    "Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 24 Stunden mit einem kostenlosen Festpreis-Angebot.",
    "",
    "Ihre Anfrage:",
    `Leistung: ${serviceLabel}`,
    `PLZ/Ort: ${data.plz}`,
    `Telefon: ${data.phone}`,
    "",
    `Telefon: ${siteConfig.contact.phoneDisplay}`,
    `E-Mail: ${siteConfig.contact.email}`,
    "",
    "Mit freundlichen Grüßen",
    "Ilyashan Fensterreinigung",
  ].join("\n");

  return {
    subject: "Ihre Anfrage bei Ilyashan Fensterreinigung – Bestätigung",
    text,
    html: buildEmailLayout({
      preheader: "Wir haben Ihre Anfrage erhalten und melden uns in Kürze.",
      title: "Vielen Dank für Ihre Anfrage",
      subtitle: "Ihre Nachricht wurde erfolgreich übermittelt",
      body,
    }),
  };
}

// Backward-compatible export
export const buildContactEmail = buildAdminNotificationEmail;
