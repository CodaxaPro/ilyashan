import { NextResponse } from "next/server";
import { verifyTerminToken } from "@/lib/termin-token";
import { getLead } from "@/lib/leads-store";
import { loadSchedulingAvailability } from "@/lib/scheduling/availability-service";
import { formatGermanDate, initialQuoteFormData } from "@/lib/quote-form";
import { TIME_SLOT_LABELS_DE } from "@/lib/scheduling/slot-engine";
import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";
import {
  formatDurationDe,
  formatTimeDe,
  resolveAppointmentTimePlan,
} from "@/lib/scheduling/appointment-times";
import { buildTerminPortalSummary, canCustomerReschedule } from "@/lib/termin-portal";
import { toIsoDate } from "@/lib/calendar/week-range";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const payload = verifyTerminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 401 });
  }

  const lead = await getLead(payload.leadId);
  if (!lead || lead.source !== "quote") {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  const quote = lead.quote?.windowCount
    ? { ...initialQuoteFormData, ...lead.quote }
    : null;

  const { availability } = await loadSchedulingAvailability({ excludeLeadId: lead.id });
  const proposedDate = lead.appointment?.proposedDate;
  const confirmedDate = lead.appointment?.confirmedDate;
  const timeSlot = lead.appointment?.timeSlot as BookableTimeSlot | undefined;
  const plan = resolveAppointmentTimePlan(lead.appointment, quote?.windowCount);
  const scheduleLabel =
    plan.plannedStartTime && confirmedDate
      ? `Ankunft gegen ${formatTimeDe(plan.plannedStartTime)}${
          plan.estimatedDurationHours ? ` · ${formatDurationDe(plan.estimatedDurationHours)}` : ""
        }`
      : undefined;

  const today = toIsoDate(new Date());
  const canReschedule = canCustomerReschedule(lead, today);
  const portal = buildTerminPortalSummary(lead);

  return NextResponse.json({
    lead: {
      id: lead.id,
      anfrageNr: lead.anfrageNr,
      name: lead.name,
      status: lead.status,
      proposedDate,
      confirmedDate,
      timeSlot,
      preferredStartTime: lead.appointment?.preferredStartTime,
      timeSlotLabel: timeSlot ? TIME_SLOT_LABELS_DE[timeSlot] : undefined,
      proposedDateLabel: proposedDate ? formatGermanDate(proposedDate) : undefined,
      confirmedDateLabel: confirmedDate ? formatGermanDate(confirmedDate) : undefined,
      plannedStartLabel: scheduleLabel,
      windowCount: quote?.windowCount,
      city: quote?.city,
      postalCode: quote?.postalCode,
    },
    availability,
    portal,
    canConfirmProposed: Boolean(proposedDate && !confirmedDate),
    canPickSlot: !confirmedDate || canReschedule,
    canReschedule,
    alreadyBooked: Boolean(confirmedDate),
    pdfUrl: portal?.canDownloadPdf ? `/api/termin/pdf?token=${encodeURIComponent(token ?? "")}` : undefined,
  });
}
