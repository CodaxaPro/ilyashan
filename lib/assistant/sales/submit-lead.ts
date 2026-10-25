/**
 * Shared lead submit for widget form + AI tool submit_customer_lead.
 */
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import { buildConciergeLeadAdminEmail } from "@/lib/concierge-email";
import { validateLeadContact } from "@/lib/concierge/lead";
import type { ConciergeSession } from "@/lib/concierge/types";
import { createConciergeStoredLead } from "@/lib/lead-records";
import { saveLead } from "@/lib/leads-store";
import {
  normalizePhotoPayloads,
  photosToResendAttachments,
  validatePhotos,
  type PhotoPayload,
} from "@/lib/photo-upload";
import { getFensterPricingConfig } from "@/lib/pricing-config";
import { createQuotePricingContext } from "@/lib/quote-pricing-context";

export type SubmitSalesLeadInput = {
  name: string;
  phone: string;
  session: ConciergeSession;
  photos?: PhotoPayload[];
  /** Free-text wish: Terminwunsch, PLZ, etc. — appended into session via quote.notes if present */
  customerNote?: string;
};

export type SubmitSalesLeadResult =
  | { ok: true; messageDe: string }
  | { ok: false; messageDe: string; code: string };

export async function submitSalesLead(
  input: SubmitSalesLeadInput
): Promise<SubmitSalesLeadResult> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const validationError = validateLeadContact(name, phone);
  if (validationError) {
    return { ok: false, code: "validation", messageDe: validationError };
  }

  let session = input.session;
  if (input.customerNote?.trim()) {
    const note = input.customerNote.trim();
    const prev = session.quote.additionalInfo ?? "";
    session = {
      ...session,
      quote: {
        ...session.quote,
        additionalInfo: [prev, note].filter(Boolean).join("\n"),
      },
    };
  }

  const photos = normalizePhotoPayloads(input.photos);
  const photoError = validatePhotos(photos);
  if (photoError) {
    return { ok: false, code: "photos", messageDe: photoError };
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    return {
      ok: false,
      code: "email_unavailable",
      messageDe: `E-Mail-Versand ist kurz nicht verfügbar. Bitte rufen Sie uns an: ${siteConfig.contact.phoneDisplay}.`,
    };
  }

  try {
    const pricingConfig = await getFensterPricingConfig();
    const pricingCtx = createQuotePricingContext(pricingConfig);
    const adminEmail = buildConciergeLeadAdminEmail(
      session,
      name,
      phone,
      photos.length,
      pricingCtx
    );
    const contactEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;
    const fromEmail =
      process.env.FROM_EMAIL ?? `Ilyashan Fensterreinigung <${siteConfig.contact.email}>`;

    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: siteConfig.contact.email,
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
      attachments: photosToResendAttachments(photos),
    });

    await saveLead(createConciergeStoredLead(session, name, phone, photos.length, pricingCtx));

    return {
      ok: true,
      messageDe: `Vielen Dank, ${name.split(" ")[0]}! Wir melden uns innerhalb von ${siteConfig.business.responseTime} mit Festpreis und Terminvorschlag. Bei Eile: ${siteConfig.contact.phoneDisplay}.`,
    };
  } catch (error) {
    console.error("[submit-sales-lead]", error);
    return {
      ok: false,
      code: "send_failed",
      messageDe: `Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an: ${siteConfig.contact.phoneDisplay}.`,
    };
  }
}
