import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  detectPriceInjection,
  normalizeContactInput,
  normalizeCustomerInput,
} from "@/lib/cleaning/normalize-input";
import {
  logClientServerDiscrepancy,
  serverCalculateCleaningQuote,
} from "@/lib/cleaning/server-calculate";
import {
  buildCleaningQuoteSnapshot,
  generateCleaningQuoteReference,
} from "@/lib/cleaning/snapshot";
import {
  createCleaningQuoteId,
  saveCleaningQuote,
} from "@/lib/cleaning/quotes-store";
import { checkRateLimit, clientIpFromRequest } from "@/lib/cleaning/rate-limit";
import { createCleaningStoredLead } from "@/lib/cleaning/lead-bridge";
import {
  buildCleaningAdminEmail,
  buildCleaningCustomerEmail,
} from "@/lib/cleaning/emails";
import { saveLead } from "@/lib/leads-store";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { buildTerminPageUrl } from "@/lib/termin-token";
import { siteConfig } from "@/lib/config";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Submit Büroreinigung quote — server recalc, immutable snapshot, CRM lead,
 * admin+customer email, calendar sync. Does not touch Fenster pricing.
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`cleaning-quote:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  if (record.website) {
    return NextResponse.json({ success: true });
  }

  const injected = detectPriceInjection(record.input ?? {});
  if (injected.length > 0) {
    return NextResponse.json(
      { error: "Ungültige Preisfelder in der Anfrage." },
      { status: 400 }
    );
  }

  const contact = normalizeContactInput(record.contact);
  if (!contact) {
    return NextResponse.json(
      {
        error:
          "Bitte Firmenname, Ansprechpartner, E-Mail, Telefon, PLZ, Ort und Datenschutzhinweis ausfüllen.",
      },
      { status: 400 }
    );
  }

  const input = normalizeCustomerInput({
    ...(typeof record.input === "object" && record.input ? record.input : {}),
    postalCode: contact.postalCode,
    city: contact.city,
  });

  if (input.totalAreaM2 <= 0) {
    return NextResponse.json(
      { error: "Bitte eine gültige Reinigungsfläche angeben." },
      { status: 400 }
    );
  }

  if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    return NextResponse.json(
      { error: "E-Mail-Versand ist noch nicht konfiguriert. Bitte rufen Sie uns direkt an." },
      { status: 503 }
    );
  }

  const { calc, public: customer, blocking, config } = serverCalculateCleaningQuote(input);

  if (blocking) {
    return NextResponse.json(
      {
        error: "Die Angaben sind mathematisch inkonsistent. Bitte Flächen prüfen.",
        validation: calc.admin.validation
          .filter((v) => v.level === "BLOCKING_ERROR")
          .map((v) => ({
            code: v.code,
            message: v.messageDe,
          })),
      },
      { status: 400 }
    );
  }

  const clientPreviewNetCents =
    typeof record.clientPreviewNetCents === "number"
      ? record.clientPreviewNetCents
      : undefined;

  const quoteReference = generateCleaningQuoteReference();
  logClientServerDiscrepancy({
    quoteReference,
    clientNetCents: clientPreviewNetCents,
    serverNetCents: customer.netCents,
  });

  const snapshot = buildCleaningQuoteSnapshot({
    quoteReference,
    input,
    contact,
    calc,
    config,
    clientPreviewNetCents,
  });

  const storedLead = createCleaningStoredLead(snapshot);
  const origin = new URL(request.url).origin;
  const terminUrl = buildTerminPageUrl(origin, storedLead.id);

  const fromEmail =
    process.env.FROM_EMAIL ?? "Ilyashan Gebäudereinigung <info@ilyashan.de>";
  const toEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;

  const adminEmail = buildCleaningAdminEmail(snapshot);
  const { error: adminError } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: adminEmail.replyTo,
    subject: adminEmail.subject,
    text: adminEmail.text,
    html: adminEmail.html,
  });

  if (adminError) {
    console.error("[cleaning/quote] admin email failed:", adminError);
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }

  const customerEmail = buildCleaningCustomerEmail(snapshot, terminUrl);
  const { error: customerError } = await resend.emails.send({
    from: fromEmail,
    to: [contact.email],
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
  });
  if (customerError) {
    console.error("[cleaning/quote] customer email failed:", customerError);
  }

  await saveLead(storedLead);
  await syncLeadToCalendar(storedLead);

  const archive = {
    id: createCleaningQuoteId(),
    createdAt: snapshot.capturedAt,
    quoteReference,
    company: contact.company,
    contactPerson: contact.contactPerson,
    email: contact.email,
    phone: contact.phone,
    postalCode: contact.postalCode,
    city: contact.city,
    totalAreaM2: input.totalAreaM2,
    frequency: input.frequency,
    netCents: customer.netCents,
    grossCents: customer.grossCents,
    quoteStatus: customer.quoteStatus,
    configVersionId: config.configVersionId,
    snapshot,
    serviceLine: "buero" as const,
  };
  const persisted = await saveCleaningQuote(archive);

  return NextResponse.json({
    success: true,
    anfrageNr: quoteReference,
    quote: customer,
    leadId: storedLead.id,
    persisted,
  });
}
