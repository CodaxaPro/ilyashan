/**
 * Enterprise chat → real appointment: same applyCustomerBooking + calendar sync as Termin-Portal.
 * Fail-closed: no invented slots, no second booking engine.
 */
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "@/lib/concierge/types";
import { validateLeadContact } from "@/lib/concierge/lead";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { buildDataTable, buildEmailLayout } from "@/lib/email-templates";
import { listLeads, saveLead, updateLead } from "@/lib/leads-store";
import { getStaffConfig } from "@/lib/staff/config";
import { applyCustomerBooking } from "@/lib/scheduling/booking";
import {
  TIME_SLOT_LABELS_DE,
  type BookableTimeSlot,
} from "@/lib/scheduling/slot-engine";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { buildSpeedToLeadAdminBlock } from "@/lib/leads/speed-to-lead";
import { buildTerminPageUrl } from "@/lib/termin-token";
import { materializeBookableLeadFromSession } from "./materialize-bookable-lead";

export type BookFromChatInput = {
  name: string;
  phone: string;
  date: string;
  timeSlot: BookableTimeSlot;
  preferredStartTime?: string;
  session: ConciergeSession;
  pricingCtx?: QuotePricingContext;
};

export type BookFromChatResult =
  | {
      ok: true;
      messageDe: string;
      leadId: string;
      confirmedDate: string;
      timeSlot: BookableTimeSlot;
    }
  | { ok: false; messageDe: string; code: string; missing?: string[] };

function isBookableSlot(slot: string): slot is BookableTimeSlot {
  return slot === "vormittag" || slot === "nachmittag" || slot === "flexibel";
}

function buildAdminBookingEmail(args: {
  name: string;
  phone: string;
  leadId: string;
  date: string;
  timeSlot: BookableTimeSlot;
  summary: string;
}) {
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const slotLabel = TIME_SLOT_LABELS_DE[args.timeSlot];
  const speed = buildSpeedToLeadAdminBlock({
    name: args.name,
    phone: args.phone,
    priority: "booked",
  });
  const terminUrl = buildTerminPageUrl(
    siteConfig.url.replace(/\/de\/?$/, "") || "https://ilyashan.de",
    args.leadId
  );
  const body = `
    ${speed.html}
    ${buildDataTable([
      ["Name", args.name],
      ["Telefon", args.phone],
      ["Termin", `${args.date} · ${slotLabel}`],
      ["Lead-ID", args.leadId],
      ...(terminUrl ? ([["Kundenportal", terminUrl]] as [string, string][]) : []),
      ["Details", args.summary.slice(0, 800)],
      ["Zeit", timestamp],
    ])}`;

  return {
    subject: `${speed.subjectPrefix}Chat-Termin: ${args.name} · ${args.date} ${slotLabel}`,
    text: [
      "CHAT-TERMIN BUCHUNG – ilyashan.de",
      speed.text,
      "",
      `Name: ${args.name}`,
      `Telefon: ${args.phone}`,
      `Termin: ${args.date} · ${slotLabel}`,
      `Lead-ID: ${args.leadId}`,
      terminUrl ? `Portal: ${terminUrl}` : "",
      "",
      args.summary,
      "",
      `Eingegangen: ${timestamp}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: buildEmailLayout({
      preheader: `Termin ${args.date} für ${args.name}`,
      title: "Chat-Termin bestätigt",
      subtitle: "Kapazität geprüft · Kalender synchronisiert",
      body,
    }),
  };
}

export async function bookAppointmentFromChat(
  input: BookFromChatInput
): Promise<BookFromChatResult> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const validationError = validateLeadContact(name, phone);
  if (validationError) {
    return { ok: false, code: "validation", messageDe: validationError };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return {
      ok: false,
      code: "invalid_date",
      messageDe: "Bitte ein gültiges Datum im Format JJJJ-MM-TT wählen.",
    };
  }

  if (!isBookableSlot(input.timeSlot)) {
    return {
      ok: false,
      code: "invalid_slot",
      messageDe: "Bitte Vormittag, Nachmittag oder Flexibel wählen.",
    };
  }

  const materialized = materializeBookableLeadFromSession(
    input.session,
    name,
    phone,
    input.pricingCtx
  );
  if (!materialized.ok) {
    return {
      ok: false,
      code: materialized.code,
      messageDe: materialized.messageDe,
      missing: materialized.missing,
    };
  }

  const [staffConfig, allLeads] = await Promise.all([
    getStaffConfig(),
    listLeads(200),
  ]);

  const booking = applyCustomerBooking(
    materialized.lead,
    staffConfig,
    allLeads,
    {
      action: "pick_slot",
      date: input.date,
      timeSlot: input.timeSlot,
      preferredStartTime: input.preferredStartTime,
    }
  );

  if (!booking.ok || !booking.appointment || !booking.status) {
    return {
      ok: false,
      code: "slot_unavailable",
      messageDe:
        booking.error ??
        "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Slot.",
    };
  }

  const leadToSave = {
    ...materialized.lead,
    status: booking.status,
    appointment: booking.appointment,
  };

  await saveLead(leadToSave);
  // Re-read path for calendar consumers that expect KV-consistent state
  const refreshed = await updateLead(leadToSave.id, {
    status: booking.status,
    appointment: booking.appointment,
  });
  const finalLead = refreshed ?? leadToSave;

  await syncLeadToCalendar(finalLead);

  const confirmedDate = finalLead.appointment?.confirmedDate ?? input.date;
  const timeSlot = (finalLead.appointment?.timeSlot as BookableTimeSlot) ?? input.timeSlot;
  const slotLabel = TIME_SLOT_LABELS_DE[timeSlot];
  const firstName = name.split(/\s+/)[0] ?? name;

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (resend && !process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    try {
      const adminEmail = buildAdminBookingEmail({
        name,
        phone,
        leadId: finalLead.id,
        date: confirmedDate,
        timeSlot,
        summary: finalLead.summary,
      });
      const contactEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;
      const fromEmail =
        process.env.FROM_EMAIL ??
        `Ilyashan Fensterreinigung <${siteConfig.contact.email}>`;
      await resend.emails.send({
        from: fromEmail,
        to: contactEmail,
        replyTo: siteConfig.contact.email,
        subject: adminEmail.subject,
        text: adminEmail.text,
        html: adminEmail.html,
      });
    } catch (err) {
      console.error("[book-from-chat] admin email failed:", err);
    }
  }

  return {
    ok: true,
    leadId: finalLead.id,
    confirmedDate,
    timeSlot,
    messageDe: [
      `Perfekt, ${firstName} — Ihr Termin ist **verbindlich vorgemerkt**:`,
      ``,
      `**${confirmedDate} · ${slotLabel}**`,
      ``,
      `Wir melden uns bei Bedarf kurz zur Feinjustierung (Zugang, Festpreis nach Prüfung).`,
      `Bei Eile: ${siteConfig.contact.phoneDisplay}.`,
    ].join("\n"),
  };
}
