import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import {
  buildAdminNotificationEmail,
  buildCustomerConfirmationEmail,
  type ContactEmailData,
} from "@/lib/email";
import { buildQuoteAdminEmail, buildQuoteCustomerEmail } from "@/lib/quote-email";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { tryGenerateQuotePdfAttachment } from "@/lib/pdf/try-generate-quote-pdf";
import { generateAnfrageNr } from "@/lib/quote-summary";
import { isQuoteSubmissionValid } from "@/lib/quote-validation";
import {
  normalizePhotoPayloads,
  photosToResendAttachments,
  validatePhotos,
  type PhotoPayload,
} from "@/lib/photo-upload";
import { saveLead } from "@/lib/leads-store";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { createQuoteStoredLead, createContactStoredLead } from "@/lib/lead-records";
import { buildTerminPageUrl } from "@/lib/termin-token";
import {
  getFensterPricingConfig,
} from "@/lib/pricing-config";
import {
  captureQuotePriceSnapshot,
  createQuotePricingContext,
} from "@/lib/quote-pricing-context";
import { enforcePhotoIntake } from "@/lib/photo-intake";
import { saveLeadPhotos } from "@/lib/lead-photos";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function isQuotePayload(body: Record<string, unknown>): body is { quote: QuoteFormData } {
  return !!body.quote && typeof body.quote === "object";
}

function mergeQuote(raw: Partial<QuoteFormData>): QuoteFormData {
  return { ...initialQuoteFormData, ...raw };
}

function validateQuote(data: QuoteFormData) {
  return isQuoteSubmissionValid(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { website } = body;

    if (website) {
      return NextResponse.json({ success: true });
    }

    // ── Wizard quote flow (5-step form) ──
    if (isQuotePayload(body)) {
      const quote = mergeQuote(body.quote);
      const photos = normalizePhotoPayloads((body as { photos?: PhotoPayload[] }).photos);
      const photoError = validatePhotos(photos);
      const photoIntake = enforcePhotoIntake({ quote, photoCount: photos.length });

      if (!validateQuote(quote)) {
        return NextResponse.json(
          { error: "Bitte füllen Sie alle Pflichtfelder aus." },
          { status: 400 }
        );
      }

      if (photoError) {
        return NextResponse.json({ error: photoError }, { status: 400 });
      }

      if (!photoIntake.ok) {
        return NextResponse.json(
          { error: photoIntake.messageDe, code: photoIntake.code },
          { status: 400 }
        );
      }

      if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
        console.error("RESEND_API_KEY fehlt oder ungültig – E-Mail konnte nicht gesendet werden.");
        return NextResponse.json(
          { error: "E-Mail-Versand ist noch nicht konfiguriert. Bitte rufen Sie uns direkt an." },
          { status: 503 }
        );
      }

      const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
      const toEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;

      const anfrageNr = generateAnfrageNr();
      const pricingConfig = await getFensterPricingConfig();
      const quotePricing = createQuotePricingContext(pricingConfig);
      const priceSnapshot = captureQuotePriceSnapshot(quote, quotePricing, pricingConfig.updatedAt);
      const storedLead = createQuoteStoredLead(quote, anfrageNr, photos.length, quotePricing, priceSnapshot);

      // 1) Lead zuerst speichern — sonst Mail ohne Admin-Eintrag (lokales Dev ohne KV).
      const saveResult = await saveLead(storedLead);
      if (!saveResult.ok) {
        return NextResponse.json(
          {
            error:
              "Anfrage konnte nicht gespeichert werden. Bitte erneut versuchen oder uns anrufen.",
            code: "lead_persist_failed",
          },
          { status: 500 }
        );
      }
      if (photos.length > 0 && saveResult.persisted) {
        await saveLeadPhotos(storedLead.id, photos);
      }

      // PDF must never block lead capture (pdfkit fonts often missing in serverless).
      const pdfAttachment = await tryGenerateQuotePdfAttachment(quote, anfrageNr, quotePricing);

      const photoAttachments = photosToResendAttachments(photos);
      const adminAttachments = [
        ...(pdfAttachment ? [pdfAttachment] : []),
        ...photoAttachments,
      ];

      const adminEmail = buildQuoteAdminEmail(quote, anfrageNr, photos.length, quotePricing);
      const { error: adminError } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        replyTo: adminEmail.replyTo,
        subject: adminEmail.subject,
        text: adminEmail.text,
        html: adminEmail.html,
        attachments: adminAttachments,
      });

      if (adminError) {
        console.error("Resend admin error:", adminError);
        return NextResponse.json(
          {
            error:
              "Lead wurde gespeichert, E-Mail konnte nicht gesendet werden. Bitte im Admin prüfen oder anrufen.",
            code: "email_failed_lead_saved",
            anfrageNr,
            leadId: storedLead.id,
            storagePersisted: saveResult.persisted,
          },
          { status: 500 }
        );
      }

      const origin = new URL(request.url).origin;
      const terminUrl = buildTerminPageUrl(origin, storedLead.id);

      if (quote.email?.trim()) {
        const customerEmail = buildQuoteCustomerEmail(quote, anfrageNr, quotePricing, terminUrl);
        const { error: customerError } = await resend.emails.send({
          from: fromEmail,
          to: [quote.email.trim()],
          subject: customerEmail.subject,
          text: customerEmail.text,
          html: customerEmail.html,
          attachments: pdfAttachment ? [pdfAttachment] : undefined,
        });

        if (customerError) {
          console.error("Resend customer confirmation error:", customerError);
        }
      }

      if (saveResult.persisted) {
        await syncLeadToCalendar(storedLead);
      }

      return NextResponse.json({
        success: true,
        anfrageNr,
        leadId: storedLead.id,
        storagePersisted: saveResult.persisted,
        ...(saveResult.persisted
          ? {}
          : {
              warning:
                "E-Mail gesendet, aber Admin-Speicher (KV) ist nicht konfiguriert — Lead erscheint nicht im Admin.",
            }),
      });
    }

    if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
      console.error("RESEND_API_KEY fehlt oder ungültig – E-Mail konnte nicht gesendet werden.");
      return NextResponse.json(
        { error: "E-Mail-Versand ist noch nicht konfiguriert. Bitte rufen Sie uns direkt an." },
        { status: 503 }
      );
    }

    const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
    const toEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;

    // ── Legacy simple contact form ──
    const { name, phone, email, plz, service, message } = body as ContactEmailData & {
      website?: string;
    };

    // Calculator services must not create thin contact leads (no prices / options).
    const calculatorOnly: Record<string, string> = {
      treppenhausreinigung: "/de/treppenhausreinigung/angebot",
      bueroreinigung: "/de/bueroreinigung/angebot",
      fensterreinigung: "/de/angebot",
    };
    if (typeof service === "string" && calculatorOnly[service]) {
      return NextResponse.json(
        {
          error: `Bitte nutzen Sie die Preiskalkulation unter ${calculatorOnly[service]} — dort werden Auswahl und Orientierung mitgesendet.`,
        },
        { status: 400 }
      );
    }

    if (!name || !phone || !plz || !service) {
      return NextResponse.json(
        { error: "Bitte füllen Sie alle Pflichtfelder aus." },
        { status: 400 }
      );
    }

    const contactData: ContactEmailData = { name, phone, email, plz, service, message };
    const photos = normalizePhotoPayloads((body as { photos?: PhotoPayload[] }).photos);
    const photoError = validatePhotos(photos);
    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 });
    }

    const contactLead = createContactStoredLead(
      { name, phone, email, plz, service, message },
      photos.length
    );
    const saveResult = await saveLead(contactLead);
    if (!saveResult.ok) {
      return NextResponse.json(
        {
          error:
            "Anfrage konnte nicht gespeichert werden. Bitte erneut versuchen oder uns anrufen.",
          code: "lead_persist_failed",
        },
        { status: 500 }
      );
    }
    if (photos.length > 0 && saveResult.persisted) {
      await saveLeadPhotos(contactLead.id, photos);
    }

    const adminEmail = buildAdminNotificationEmail(contactData, photos.length);

    const { error: adminError } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: adminEmail.replyTo,
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
      attachments: photosToResendAttachments(photos),
    });

    if (adminError) {
      console.error("Resend admin error:", adminError);
      const errorMessage =
        adminError.message?.includes("not verified")
          ? "E-Mail-Versand wartet auf Domain-Verifizierung. Bitte rufen Sie uns direkt an."
          : "Lead wurde gespeichert, E-Mail konnte nicht gesendet werden. Bitte im Admin prüfen.";
      return NextResponse.json(
        {
          error: errorMessage,
          code: "email_failed_lead_saved",
          leadId: contactLead.id,
          storagePersisted: saveResult.persisted,
        },
        { status: 500 }
      );
    }

    if (email) {
      const customerEmail = buildCustomerConfirmationEmail(contactData);
      const { error: customerError } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: customerEmail.subject,
        text: customerEmail.text,
        html: customerEmail.html,
      });

      if (customerError) {
        console.error("Resend customer confirmation error:", customerError);
      }
    }

    return NextResponse.json({
      success: true,
      leadId: contactLead.id,
      storagePersisted: saveResult.persisted,
      ...(saveResult.persisted
        ? {}
        : {
            warning:
              "E-Mail gesendet, aber Admin-Speicher (KV) ist nicht konfiguriert — Lead erscheint nicht im Admin.",
          }),
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}
