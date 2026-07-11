import { NextResponse } from "next/server";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { buildAppointmentConfirmationEmail } from "@/lib/appointment-email";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { getLead, isLeadsStoreConfigured, updateLead, type LeadStatus } from "@/lib/leads-store";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const VALID_STATUSES: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "termin_vorgeschlagen",
  "termin_bestaetigt",
  "abgeschlossen",
  "abgelehnt",
];

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin-Zugang ist nicht konfiguriert (ADMIN_PASSWORD fehlt)." },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  return null;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw) return null;
  return { ...initialQuoteFormData, ...raw };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ lead, storageConfigured: isLeadsStoreConfigured() });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!isLeadsStoreConfigured()) {
    return NextResponse.json({ error: "KV-Speicher nicht konfiguriert." }, { status: 503 });
  }

  const { id } = await context.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });
  }

  const body = (await request.json()) as {
    status?: LeadStatus;
    adminNotes?: string;
    proposedDate?: string;
    confirmedDate?: string;
    appointmentNote?: string;
    sendConfirmationEmail?: boolean;
  };

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  const appointment = {
    ...lead.appointment,
    ...(body.proposedDate !== undefined ? { proposedDate: body.proposedDate || undefined } : {}),
    ...(body.confirmedDate !== undefined
      ? {
          confirmedDate: body.confirmedDate || undefined,
          confirmedAt: body.confirmedDate ? new Date().toISOString() : undefined,
        }
      : {}),
    ...(body.appointmentNote !== undefined ? { note: body.appointmentNote || undefined } : {}),
  };

  let status = body.status ?? lead.status ?? "neu";
  if (body.confirmedDate) status = "termin_bestaetigt";
  else if (body.proposedDate) status = "termin_vorgeschlagen";

  const updated = await updateLead(id, {
    status,
    adminNotes: body.adminNotes ?? lead.adminNotes,
    appointment,
  });

  if (!updated) {
    return NextResponse.json({ error: "Lead konnte nicht aktualisiert werden." }, { status: 500 });
  }

  let emailSent = false;
  let emailError: string | null = null;

  if (
    body.sendConfirmationEmail &&
    body.confirmedDate &&
    lead.source === "quote" &&
    lead.email?.trim()
  ) {
    const quote = mergeQuote(lead.quote);
    if (!quote) {
      emailError = "Vollständige Anfragedaten fehlen.";
    } else if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
      emailError = "E-Mail-Versand nicht konfiguriert.";
    } else {
      const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
      const customerEmail = buildAppointmentConfirmationEmail(
        quote,
        lead.anfrageNr ?? id,
        body.confirmedDate,
        body.appointmentNote ?? appointment.note
      );

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [lead.email.trim()],
        subject: customerEmail.subject,
        text: customerEmail.text,
        html: customerEmail.html,
      });

      if (error) {
        emailError = error.message ?? "E-Mail konnte nicht gesendet werden.";
      } else {
        emailSent = true;
      }
    }
  }

  return NextResponse.json({
    success: true,
    lead: updated,
    emailSent,
    emailError,
  });
}
