/**
 * P2 — assistant tool: request Anzahlung after Festpreis path (CRM + mail).
 */
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "@/lib/concierge/types";
import { validateLeadContact } from "@/lib/concierge/lead";
import {
  depositRecommendedForProduct,
  sessionSuggestsDeposit,
  suggestDepositAmountEur,
} from "@/lib/deposits/policy";
import {
  buildDepositAdminBlock,
  buildDepositCustomerEmail,
  createDepositRequest,
} from "@/lib/deposits/request-deposit";
import { createConciergeStoredLead } from "@/lib/lead-records";
import { saveLead, type StoredLead } from "@/lib/leads-store";
import { getFensterPricingConfig } from "@/lib/pricing-config";
import { createQuotePricingContext } from "@/lib/quote-pricing-context";
import { buildConciergeLeadAdminEmail } from "@/lib/concierge-email";

export type RequestDepositInput = {
  name: string;
  phone: string;
  email?: string;
  amountEur?: number;
  session: ConciergeSession;
  festpreisHint?: number;
};

export type RequestDepositResult =
  | { ok: true; messageDe: string; amountEur: number; reference: string }
  | { ok: false; code: string; messageDe: string };

export async function requestDepositFromChat(
  input: RequestDepositInput
): Promise<RequestDepositResult> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const validationError = validateLeadContact(name, phone);
  if (validationError) {
    return { ok: false, code: "validation", messageDe: validationError };
  }

  if (
    !depositRecommendedForProduct(input.session.assistantProduct) &&
    !sessionSuggestsDeposit(input.session) &&
    !(typeof input.festpreisHint === "number" && input.festpreisHint >= 400)
  ) {
    return {
      ok: false,
      code: "not_required",
      messageDe:
        "Für diese Anfrage ist keine Anzahlung nötig. Wir können Termin oder Rückruf ohne Anzahlung fortsetzen.",
    };
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    return {
      ok: false,
      code: "email_unavailable",
      messageDe: `E-Mail kurz nicht verfügbar. Bitte anrufen: ${siteConfig.contact.phoneDisplay}.`,
    };
  }

  try {
    const pricingConfig = await getFensterPricingConfig();
    const pricingCtx = createQuotePricingContext(pricingConfig);
    const amount = suggestDepositAmountEur(input.festpreisHint ?? input.amountEur);

    const lead = createConciergeStoredLead(
      input.session,
      name,
      phone,
      0,
      pricingCtx
    ) as StoredLead;
    lead.email = input.email?.trim() || undefined;
    lead.festpreis = input.festpreisHint;
    const deposit = createDepositRequest(
      { id: lead.id, festpreis: lead.festpreis },
      input.amountEur ?? amount
    );
    lead.deposit = deposit;
    lead.hot = true;
    lead.summary = `${lead.summary} · Anzahlung ${deposit.amountEur}€ (${deposit.reference})`;

    const adminEmail = buildConciergeLeadAdminEmail(
      input.session,
      name,
      phone,
      0,
      pricingCtx
    );
    const depositAdmin = buildDepositAdminBlock(deposit);
    const contactEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;
    const fromEmail =
      process.env.FROM_EMAIL ?? `Ilyashan Fensterreinigung <${siteConfig.contact.email}>`;

    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: siteConfig.contact.email,
      subject: `💰 Anzahlung ${deposit.amountEur}€ · ${adminEmail.subject}`,
      text: `${adminEmail.text}\n\n${depositAdmin.text}`,
      html: `${adminEmail.html}${depositAdmin.html}`,
    });

    if (lead.email) {
      const customer = buildDepositCustomerEmail({
        name,
        deposit,
        anfrageNr: lead.anfrageNr,
      });
      await resend.emails.send({
        from: fromEmail,
        to: lead.email,
        subject: customer.subject,
        text: customer.text,
        html: customer.html,
      });
    }

    await saveLead(lead);

    return {
      ok: true,
      amountEur: deposit.amountEur,
      reference: deposit.reference,
      messageDe: lead.email
        ? `Vielen Dank. Wir haben Ihnen die Anzahlungsdaten (${deposit.amountEur} €, Verwendungszweck ${deposit.reference}) per E-Mail geschickt. Nach Eingang bestätigen wir den Termin.`
        : `Anzahlung ${deposit.amountEur} € — Verwendungszweck ${deposit.reference}. Bitte nennen Sie uns Ihre E-Mail, dann senden wir die Überweisungsdaten. Oder anrufen: ${siteConfig.contact.phoneDisplay}.`,
    };
  } catch (error) {
    console.error("[request-deposit]", error);
    return {
      ok: false,
      code: "send_failed",
      messageDe: `Anzahlung konnte nicht angelegt werden. Bitte anrufen: ${siteConfig.contact.phoneDisplay}.`,
    };
  }
}
