/**
 * P2 — request Anzahlung: CRM patch + admin/customer email copy builders.
 */
import { siteConfig } from "@/lib/config";
import {
  buildDepositReference,
  depositBankCopy,
  suggestDepositAmountEur,
  type LeadDeposit,
} from "@/lib/deposits/policy";
import type { StoredLead } from "@/lib/leads-store";

export function createDepositRequest(
  lead: Pick<StoredLead, "id" | "festpreis" | "deposit">,
  amountEur?: number
): LeadDeposit {
  const amount =
    typeof amountEur === "number" && amountEur > 0
      ? Math.round(amountEur)
      : suggestDepositAmountEur(lead.festpreis);
  return {
    status: "requested",
    amountEur: amount,
    currency: "EUR",
    reference: lead.deposit?.reference ?? buildDepositReference(lead.id),
    requestedAt: new Date().toISOString(),
    note: lead.deposit?.note,
  };
}

export function markDepositPaid(deposit: LeadDeposit): LeadDeposit {
  return {
    ...deposit,
    status: "paid",
    paidAt: new Date().toISOString(),
  };
}

export function markDepositWaived(deposit: LeadDeposit | undefined, leadId: string): LeadDeposit {
  const base =
    deposit ??
    ({
      status: "requested" as const,
      amountEur: 0,
      currency: "EUR" as const,
      reference: buildDepositReference(leadId),
      requestedAt: new Date().toISOString(),
    } satisfies LeadDeposit);
  return {
    ...base,
    status: "waived",
    waivedAt: new Date().toISOString(),
  };
}

export function buildDepositCustomerEmail(input: {
  name: string;
  deposit: LeadDeposit;
  anfrageNr?: string;
}): { subject: string; text: string; html: string } {
  const bank = depositBankCopy();
  const first = input.name.split(/\s+/)[0] || input.name;
  const subject = `Anzahlung ${input.deposit.amountEur} € — ${siteConfig.name}`;
  const text = [
    `Guten Tag ${first},`,
    "",
    `für Ihre Anfrage${input.anfrageNr ? ` (${input.anfrageNr})` : ""} bitten wir um eine Anzahlung von ${input.deposit.amountEur} €.`,
    "",
    `Empfänger: ${bank.recipient}`,
    `IBAN: ${bank.ibanHint}`,
    `Verwendungszweck: ${input.deposit.reference}`,
    "",
    bank.noteDe,
    "",
    `Fragen? ${siteConfig.contact.phoneDisplay}`,
    "",
    `Freundliche Grüße`,
    siteConfig.name,
  ].join("\n");

  const html = `
    <p>Guten Tag ${escapeHtml(first)},</p>
    <p>für Ihre Anfrage${input.anfrageNr ? ` (<strong>${escapeHtml(input.anfrageNr)}</strong>)` : ""} bitten wir um eine <strong>Anzahlung von ${input.deposit.amountEur}&nbsp;€</strong>.</p>
    <ul>
      <li>Empfänger: ${escapeHtml(bank.recipient)}</li>
      <li>IBAN: ${escapeHtml(bank.ibanHint)}</li>
      <li>Verwendungszweck: <strong>${escapeHtml(input.deposit.reference)}</strong></li>
    </ul>
    <p style="color:#64748b;font-size:13px;">${escapeHtml(bank.noteDe)}</p>
    <p>Fragen? <a href="tel:${siteConfig.contact.phone}">${escapeHtml(siteConfig.contact.phoneDisplay)}</a></p>
    <p>Freundliche Grüße<br/>${escapeHtml(siteConfig.name)}</p>
  `.trim();

  return { subject, text, html };
}

export function buildDepositAdminBlock(deposit: LeadDeposit): { text: string; html: string } {
  const bank = depositBankCopy();
  const text = [
    "── ANZAHLUNG ──",
    `Status: ${deposit.status}`,
    `Betrag: ${deposit.amountEur} €`,
    `Ref: ${deposit.reference}`,
    `IBAN: ${bank.ibanHint}`,
  ].join("\n");
  const html = `
    <div style="margin:16px 0;padding:12px;border:1px solid #f59e0b;border-radius:8px;background:#fffbeb;">
      <strong>Anzahlung</strong>
      <div>${deposit.amountEur}&nbsp;€ · ${escapeHtml(deposit.status)} · Ref <code>${escapeHtml(deposit.reference)}</code></div>
    </div>
  `.trim();
  return { text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
