import { NextResponse } from "next/server";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { buildLeadStatusEmail } from "@/lib/appointment-email";
import { resolveServerQuotePricing } from "@/lib/quote-pricing-context";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { buildTerminPageUrl } from "@/lib/termin-token";
import { getStaffConfig } from "@/lib/staff/config";
import { validateAdminSlotAssignment } from "@/lib/scheduling/booking";
import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import {
  buildEmailNotificationRecord,
  resolveEmailActionForSave,
  resolveLeadUpdate,
  type LeadEmailActionInput,
  type LeadPatchInput,
} from "@/lib/lead-workflow";
import {
  getLead,
  isLeadsStoreConfigured,
  listLeads,
  updateLead,
  type LeadEmailAction,
  type LeadStatus,
  type StoredLead,
} from "@/lib/leads-store";

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
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

async function sendLeadEmail(
  action: LeadEmailAction,
  lead: Pick<StoredLead, "email" | "anfrageNr" | "id" | "quote" | "priceSnapshot">,
  options: {
    confirmedDate?: string;
    previousConfirmedDate?: string;
    proposedDate?: string;
    note?: string;
    terminUrl?: string | null;
    appointment?: StoredLead["appointment"];
    windowCount?: number;
  }
) {
  const quote = mergeQuote(lead.quote);
  if (!quote) {
    return { emailSent: false, emailError: "Vollständige Anfragedaten fehlen." };
  }
  if (!lead.email?.trim()) {
    return { emailSent: false, emailError: "Müşteri e-postası yok." };
  }
  if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    return { emailSent: false, emailError: "E-Mail-Versand nicht konfiguriert." };
  }

  const ctx = await resolveServerQuotePricing(lead);
  const customerEmail = buildLeadStatusEmail(action, quote, lead.anfrageNr ?? lead.id, options, ctx);
  const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [lead.email.trim()],
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
  });

  if (error) {
    return { emailSent: false, emailError: error.message ?? "E-Mail konnte nicht gesendet werden." };
  }

  return { emailSent: true, emailError: null };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const terminUrl = buildTerminPageUrl(origin, lead.id);

  return NextResponse.json({ lead, storageConfigured: isLeadsStoreConfigured(), terminUrl });
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

  const body = (await request.json()) as LeadPatchInput & {
    sendConfirmationEmail?: boolean;
    emailAction?: LeadEmailActionInput;
  };

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  const patchInput: LeadPatchInput = {
    status: body.status,
    adminNotes: body.adminNotes,
    proposedDate: body.proposedDate,
    confirmedDate: body.confirmedDate,
    timeSlot: body.timeSlot,
    staffId: body.staffId,
    preferredStartTime: body.preferredStartTime,
    plannedStartTime: body.plannedStartTime,
    estimatedDurationHours: body.estimatedDurationHours,
    appointmentNote: body.appointmentNote,
    emailAction:
      body.emailAction ??
      (body.sendConfirmationEmail ? "confirm" : "none"),
  };

  const [staffConfig, allLeads] = await Promise.all([getStaffConfig(), listLeads(200)]);
  const slotDate = patchInput.confirmedDate || patchInput.proposedDate;
  const slotTime =
    patchInput.timeSlot === "vormittag" || patchInput.timeSlot === "nachmittag" || patchInput.timeSlot === "flexibel"
      ? patchInput.timeSlot
      : (lead.appointment?.timeSlot as BookableTimeSlot | undefined) ?? "flexibel";

  if (slotDate && lead.source === "quote") {
    const capacity = validateAdminSlotAssignment(
      lead,
      staffConfig,
      allLeads,
      slotDate,
      slotTime,
      patchInput.staffId || lead.appointment?.staffId
    );
    if (!capacity.ok) {
      return NextResponse.json({ error: capacity.error ?? "Kapazität voll." }, { status: 409 });
    }
    if (capacity.staffId && !patchInput.staffId) {
      patchInput.staffId = capacity.staffId;
    }
  }

  const previousConfirmedDate = lead.appointment?.confirmedDate;
  const { status, appointment } = resolveLeadUpdate(lead, patchInput);
  const emailAction = resolveEmailActionForSave(lead, patchInput);

  let emailSent = false;
  let emailError: string | null = null;
  let emailActionUsed: LeadEmailAction | null = null;

  if (emailAction && lead.source === "quote") {
    const origin = new URL(request.url).origin;
    const terminUrl = buildTerminPageUrl(origin, lead.id);
    const quote = mergeQuote(lead.quote);
    const result = await sendLeadEmail(emailAction, lead, {
      confirmedDate: appointment.confirmedDate ?? patchInput.confirmedDate,
      previousConfirmedDate,
      proposedDate: appointment.proposedDate ?? patchInput.proposedDate,
      note: appointment.note,
      terminUrl: emailAction === "propose" ? terminUrl : null,
      appointment,
      windowCount: quote?.windowCount,
    });
    emailSent = result.emailSent;
    emailError = result.emailError;
    emailActionUsed = emailSent ? emailAction : null;
  }

  const finalAppointment = emailActionUsed
    ? {
        ...appointment,
        lastEmail: buildEmailNotificationRecord(emailActionUsed, status, appointment),
      }
    : appointment;

  const updated = await updateLead(id, {
    status,
    adminNotes: body.adminNotes ?? lead.adminNotes,
    appointment: finalAppointment,
  });

  if (!updated) {
    return NextResponse.json({ error: "Lead konnte nicht aktualisiert werden." }, { status: 500 });
  }

  await syncLeadToCalendar(updated);

  return NextResponse.json({
    success: true,
    lead: updated,
    emailSent,
    emailError,
    emailAction: emailActionUsed,
  });
}
