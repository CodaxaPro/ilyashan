import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyTerminToken } from "@/lib/termin-token";
import { getLead, listLeads, updateLead } from "@/lib/leads-store";
import { getStaffConfig } from "@/lib/staff/config";
import { applyCustomerBooking, type BookingInput } from "@/lib/scheduling/booking";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { buildAppointmentConfirmationEmail } from "@/lib/appointment-email";
import { resolveServerQuotePricing } from "@/lib/quote-pricing-context";
import { initialQuoteFormData } from "@/lib/quote-form";
import { buildEmailNotificationRecord } from "@/lib/lead-workflow";
import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function mergeQuote(raw: Partial<typeof initialQuoteFormData> | undefined) {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BookingInput & { token?: string };
  const payload = verifyTerminToken(body.token);
  if (!payload) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 401 });
  }

  const lead = await getLead(payload.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  const [staffConfig, allLeads] = await Promise.all([getStaffConfig(), listLeads(200)]);
  const result = applyCustomerBooking(lead, staffConfig, allLeads, {
    action: body.action,
    date: body.date,
    timeSlot: body.timeSlot as BookableTimeSlot | undefined,
    preferredStartTime: body.preferredStartTime,
  });

  if (!result.ok || !result.appointment || !result.status) {
    return NextResponse.json({ error: result.error ?? "Buchung fehlgeschlagen." }, { status: 400 });
  }

  const updated = await updateLead(lead.id, {
    status: result.status,
    appointment: result.appointment,
  });

  if (!updated) {
    return NextResponse.json({ error: "Termin konnte nicht gespeichert werden." }, { status: 500 });
  }

  await syncLeadToCalendar(updated);

  let emailSent = false;
  const quote = mergeQuote(updated.quote);
  if (quote && updated.email?.trim() && resend && updated.appointment?.confirmedDate) {
    try {
      const ctx = await resolveServerQuotePricing(updated);
      const email = buildAppointmentConfirmationEmail(
        quote,
        updated.anfrageNr ?? updated.id,
        updated.appointment.confirmedDate,
        updated.appointment.note,
        ctx,
        updated.appointment
      );
      const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [updated.email.trim()],
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      emailSent = !error;
      if (emailSent) {
        await updateLead(updated.id, {
          appointment: {
            ...updated.appointment,
            lastEmail: buildEmailNotificationRecord("confirm", result.status, updated.appointment),
          },
        });
      }
    } catch (err) {
      console.error("[termin/book] email failed:", err);
    }
  }

  return NextResponse.json({
    success: true,
    lead: updated,
    emailSent,
    confirmedDate: updated.appointment?.confirmedDate,
    timeSlot: updated.appointment?.timeSlot,
  });
}
