import { siteConfig } from "@/lib/config";
import {
  buildButton,
  buildDataTable,
  buildEmailLayout,
  buildInfoBox,
  escapeHtml,
} from "@/lib/email-templates";
import { formatEuroFromCents } from "@/lib/treppenhaus/pricing";
import type { TreppenhausQuoteSnapshot } from "@/lib/treppenhaus/snapshot";

const TURNUS_LABEL = {
  weekly: "Wöchentlich",
  biweekly: "Alle 14 Tage",
  monthly: "Monatlich",
} as const;

const DIRT_LABEL = {
  normal: "Normal",
  medium: "Erhöht",
  heavy: "Stark",
} as const;

function summaryRows(snap: TreppenhausQuoteSnapshot): [string, string][] {
  const { input, quote, contact } = snap;
  return [
    ["Anfrage-Nr.", snap.quoteReference],
    ["Name", contact.name],
    ["Ort", `${contact.postalCode} ${contact.city}`.trim()],
    ["Stockwerke", String(input.stockwerke)],
    ["Wohnungen", String(input.wohnungen)],
    ["Turnus Treppenhaus", TURNUS_LABEL[input.stairTurnus]],
    ["Verschmutzung", DIRT_LABEL[input.dirtLevel]],
    [
      "Keller",
      input.keller ? `${TURNUS_LABEL[input.kellerTurnus]}` : "Nein",
    ],
    ["Aufzug", input.aufzug ? "Ja" : "Nein"],
    ["Glas/Handlauf", input.glasHandlauf ? "Ja" : "Nein"],
    ["Orientierung netto/Monat", formatEuroFromCents(quote.monthlyNetCents)],
    ["Orientierung brutto/Monat", formatEuroFromCents(quote.monthlyGrossCents)],
    ...(quote.needsInspection ? ([["Status", "Besichtigung empfohlen"]] as [string, string][]) : []),
  ];
}

export function buildTreppenhausAdminEmail(snap: TreppenhausQuoteSnapshot) {
  const rows = summaryRows(snap);
  const subject = `Neue Treppenhausreinigung ${snap.quoteReference}: ${snap.contact.name} (${snap.contact.postalCode})`;
  const html = buildEmailLayout({
    preheader: subject,
    title: "Neue Treppenhaus-Anfrage",
    subtitle: `${snap.quoteReference} · ${escapeHtml(snap.contact.name)}`,
    body: `
      ${buildInfoBox(`<strong>Treppenhausreinigung</strong> · ${escapeHtml(snap.quoteReference)}`)}
      ${buildDataTable(rows)}
      ${
        snap.contact.notes
          ? `<p style="margin-top:16px;font-size:14px;"><strong>Notiz:</strong> ${escapeHtml(snap.contact.notes)}</p>`
          : ""
      }
    `,
  });
  const text = ["NEUE TREPPENHAUSREINIGUNG", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  return { subject, html, text, replyTo: snap.contact.email };
}

export function buildTreppenhausCustomerEmail(snap: TreppenhausQuoteSnapshot) {
  const rows = summaryRows(snap);
  const subject = `Ihre Treppenhaus-Anfrage ${snap.quoteReference}`;
  const html = buildEmailLayout({
    preheader: subject,
    title: "Vielen Dank für Ihre Anfrage",
    subtitle: snap.quoteReference,
    body: `
      <p style="font-size:15px;line-height:1.6;color:#334155;">
        Guten Tag ${escapeHtml(snap.contact.name)},<br/><br/>
        wir haben Ihre Kalkulation zur Treppenhausreinigung erhalten
        (<strong>${escapeHtml(snap.quoteReference)}</strong>).
        Die angezeigte Summe ist eine Orientierung — den Festpreis nennen wir nach Prüfung.
      </p>
      ${buildDataTable(rows)}
      <p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:16px;">
        Antwort in der Regel innerhalb von ${escapeHtml(siteConfig.business.responseTime)}.
      </p>
      ${buildButton(`tel:${siteConfig.contact.phone}`, `Anrufen ${siteConfig.contact.phoneDisplay}`, "#0369a1")}
    `,
  });
  const text = [
    `Ihre Treppenhaus-Anfrage ${snap.quoteReference}`,
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");
  return { subject, html, text };
}
