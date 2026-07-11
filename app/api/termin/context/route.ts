import { NextResponse } from "next/server";
import { verifyTerminToken } from "@/lib/termin-token";
import { getLead } from "@/lib/leads-store";
import { loadSchedulingAvailability } from "@/lib/scheduling/availability-service";
import { formatGermanDate, initialQuoteFormData } from "@/lib/quote-form";
import { TIME_SLOT_LABELS_DE } from "@/lib/scheduling/slot-engine";
import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";

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

  return NextResponse.json({
    lead: {
      id: lead.id,
      anfrageNr: lead.anfrageNr,
      name: lead.name,
      status: lead.status,
      proposedDate,
      confirmedDate,
      timeSlot,
      timeSlotLabel: timeSlot ? TIME_SLOT_LABELS_DE[timeSlot] : undefined,
      proposedDateLabel: proposedDate ? formatGermanDate(proposedDate) : undefined,
      confirmedDateLabel: confirmedDate ? formatGermanDate(confirmedDate) : undefined,
      windowCount: quote?.windowCount,
      city: quote?.city,
      postalCode: quote?.postalCode,
    },
    availability,
    canConfirmProposed: Boolean(proposedDate && !confirmedDate),
    canPickSlot: !confirmedDate,
    alreadyBooked: Boolean(confirmedDate),
  });
}
