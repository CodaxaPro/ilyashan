import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { buildLeadStatusEmail } from "@/lib/appointment-email";
import { canRescheduleAppointment } from "@/lib/calendar/appointment-from-lead";
import {
  getAppointmentById,
  isAppointmentsDbConfigured,
  syncLeadAppointments,
  updateAppointmentEventDate,
} from "@/lib/calendar/appointments-db";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { parseLocalAppointmentId } from "@/lib/calendar/local-appointment-id";
import {
  buildRescheduleLeadUpdate,
  resolvePreviousAppointmentDate,
} from "@/lib/calendar/reschedule-lead";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { getLead, isLeadsStoreConfigured, updateLead } from "@/lib/leads-store";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin yapılandırılmamış." }, { status: 503 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  return null;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!isLeadsStoreConfigured()) {
    return NextResponse.json({ error: "KV depolama yapılandırılmamış." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    eventDate?: string;
    sendUpdateEmail?: boolean;
  };

  if (!body.eventDate) {
    return NextResponse.json({ error: "eventDate gerekli." }, { status: 400 });
  }

  let appointment = isAppointmentsDbConfigured() ? await getAppointmentById(id) : null;

  if (!appointment) {
    const parsed = parseLocalAppointmentId(id);
    const lead = parsed ? await getLead(parsed.leadId) : null;
    if (!lead || !parsed) {
      return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }
    appointment = {
      id,
      leadId: lead.id,
      role: parsed.role,
      kind: lead.quote?.services?.includes("wartung") ? "wartung" : "single",
      status: parsed.role === "confirmed" ? "bestätigt" : "vorgeschlagen",
      eventDate:
        parsed.role === "confirmed"
          ? (lead.appointment?.confirmedDate ?? body.eventDate)
          : parsed.role === "proposed"
            ? (lead.appointment?.proposedDate ?? body.eventDate)
            : body.eventDate,
      customerName: lead.name,
      title: lead.name,
    };
  }

  if (!canRescheduleAppointment(appointment)) {
    return NextResponse.json({ error: "Bu randevu taşınamaz." }, { status: 400 });
  }

  const lead = await getLead(appointment.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead bulunamadı." }, { status: 404 });
  }

  const previousDate = resolvePreviousAppointmentDate(lead, appointment);

  const { appointment: appointmentPatch, status: nextStatus } = buildRescheduleLeadUpdate(
    lead,
    appointment,
    body.eventDate
  );

  const updatedLead = await updateLead(lead.id, {
    status: nextStatus,
    appointment: appointmentPatch,
  });

  if (!updatedLead) {
    return NextResponse.json({ error: "Lead güncellenemedi." }, { status: 500 });
  }

  await syncLeadToCalendar(updatedLead);

  let updatedAppointment = { ...appointment, eventDate: body.eventDate };
  if (isAppointmentsDbConfigured() && !id.startsWith("local-")) {
    const dbRow = await updateAppointmentEventDate(id, body.eventDate);
    if (dbRow) updatedAppointment = dbRow;
    else await syncLeadAppointments(updatedLead);
  }

  let emailSent = false;
  let emailError: string | null = null;

  if (
    body.sendUpdateEmail &&
    appointment.role === "confirmed" &&
    lead.email?.trim() &&
    lead.source === "quote"
  ) {
    const quote = mergeQuote(lead.quote);
    if (!quote) {
      emailError = "Anfragedaten fehlen.";
    } else if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
      emailError = "E-Mail nicht konfiguriert.";
    } else {
      const mail = buildLeadStatusEmail("update", quote, lead.anfrageNr ?? lead.id, {
        confirmedDate: body.eventDate,
        previousConfirmedDate: previousDate,
        note: appointmentPatch.note,
      });
      const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [lead.email.trim()],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      if (error) emailError = error.message ?? "E-Mail fehlgeschlagen.";
      else emailSent = true;
    }
  }

  return NextResponse.json({
    success: true,
    appointment: updatedAppointment,
    lead: updatedLead,
    emailSent,
    emailError,
  });
}
