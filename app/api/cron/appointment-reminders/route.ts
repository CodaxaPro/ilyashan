import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildAppointmentReminderEmail } from "@/lib/appointment-email";
import { buildCleaningReminderEmail } from "@/lib/cleaning/emails";
import { listLeads, updateLead } from "@/lib/leads-store";
import { resolveServerQuotePricing } from "@/lib/quote-pricing-context";
import {
  buildReminderAppointmentPatch,
  findReminderCandidates,
  type ReminderWave,
} from "@/lib/scheduling/appointment-reminders";
import { berlinIsoDate, berlinTomorrowIso } from "@/lib/scheduling/berlin-date";
import { isBueroLead, isTreppenhausLead } from "@/lib/lead-product";
import { buildTerminPageUrl } from "@/lib/termin-token";
import { siteConfig } from "@/lib/config";
import { initialQuoteFormData } from "@/lib/quote-form";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function resolveWave(request: Request): ReminderWave {
  const url = new URL(request.url);
  const q = url.searchParams.get("wave");
  return q === "morning" ? "morning" : "eve";
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY yapılandırılmamış." }, { status: 503 });
  }

  const wave = resolveWave(request);
  const targetDate = wave === "morning" ? berlinIsoDate() : berlinTomorrowIso();
  const leads = await listLeads(200);
  const candidates = findReminderCandidates(leads, targetDate, wave);
  const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
  const origin = siteConfig.url.replace(/\/de\/?$/, "") || "https://ilyashan.de";

  const results: Array<{ leadId: string; ok: boolean; error?: string }> = [];

  for (const { lead, quote, confirmedDate } of candidates) {
    try {
      const terminUrl = buildTerminPageUrl(origin, lead.id);
      let email: { subject: string; text: string; html: string };
      if (isBueroLead(lead) && lead.cleaningSnapshot) {
        email = buildCleaningReminderEmail(
          lead.cleaningSnapshot,
          confirmedDate,
          lead.appointment,
          lead.festpreis
        );
      } else if (isTreppenhausLead(lead)) {
        const ctx = await resolveServerQuotePricing(lead);
        const synthetic = {
          ...initialQuoteFormData,
          ...quote,
          firstName: lead.name.split(/\s+/)[0] ?? lead.name,
          lastName: lead.name.split(/\s+/).slice(1).join(" "),
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          windowCount: quote?.windowCount && quote.windowCount > 0 ? quote.windowCount : 1,
          services: quote?.services?.length ? quote.services : ["privat"],
        };
        email = buildAppointmentReminderEmail(
          synthetic,
          lead.anfrageNr ?? lead.id,
          confirmedDate,
          ctx,
          lead.appointment,
          lead.festpreis,
          { terminUrl, wave }
        );
      } else if (quote) {
        const ctx = await resolveServerQuotePricing(lead);
        email = buildAppointmentReminderEmail(
          quote,
          lead.anfrageNr ?? lead.id,
          confirmedDate,
          ctx,
          lead.appointment,
          lead.festpreis,
          { terminUrl, wave }
        );
      } else {
        results.push({ leadId: lead.id, ok: false, error: "incomplete_quote" });
        continue;
      }

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
        appointment: buildReminderAppointmentPatch(lead.appointment, confirmedDate, wave),
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
    wave,
    targetDate,
    candidates: candidates.length,
    sent,
    failed,
    results,
  });
}
