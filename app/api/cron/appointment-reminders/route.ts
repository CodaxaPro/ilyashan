import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildAppointmentReminderEmail } from "@/lib/appointment-email";
import { listLeads, updateLead } from "@/lib/leads-store";
import { resolveServerQuotePricing } from "@/lib/quote-pricing-context";
import {
  buildReminderAppointmentPatch,
  findReminderCandidates,
} from "@/lib/scheduling/appointment-reminders";
import { berlinIsoDate, berlinTomorrowIso } from "@/lib/scheduling/berlin-date";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY yapılandırılmamış." }, { status: 503 });
  }

  const targetDate = berlinTomorrowIso();
  const leads = await listLeads(200);
  const candidates = findReminderCandidates(leads, targetDate);
  const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";

  const results: Array<{ leadId: string; ok: boolean; error?: string }> = [];

  for (const { lead, quote, confirmedDate } of candidates) {
    try {
      const ctx = await resolveServerQuotePricing(lead);
      const email = buildAppointmentReminderEmail(
        quote,
        lead.anfrageNr ?? lead.id,
        confirmedDate,
        ctx,
        lead.appointment
      );

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [lead.email!.trim()],
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      if (error) {
        results.push({ leadId: lead.id, ok: false, error: error.message });
        continue;
      }

      await updateLead(lead.id, {
        appointment: buildReminderAppointmentPatch(lead.appointment, confirmedDate),
      });
      results.push({ leadId: lead.id, ok: true });
    } catch (err) {
      results.push({
        leadId: lead.id,
        ok: false,
        error: err instanceof Error ? err.message : "send failed",
      });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    success: true,
    berlinToday: berlinIsoDate(),
    targetDate,
    candidates: candidates.length,
    sent,
    failed,
    results,
  });
}
