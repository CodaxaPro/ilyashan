import { addDaysIso, toIsoDate } from "@/lib/calendar/week-range";
import { createQuoteStoredLead } from "@/lib/lead-records";
import type { StoredLead } from "@/lib/leads-store";
import { saveLead } from "@/lib/leads-store";
import { defaultQuotePricingContext, captureQuotePriceSnapshot } from "@/lib/quote-pricing-context";
import { initialQuoteFormData } from "@/lib/quote-form";
import { createTerminToken } from "@/lib/termin-token";

export type TerminFixtureScenario = "proposed" | "pick_slot" | "already_booked" | "wartung_pick";

function futureIso(daysFromToday: number): string {
  return addDaysIso(toIsoDate(new Date()), daysFromToday);
}

function buildBaseQuote() {
  return {
    ...initialQuoteFormData,
    services: ["privat" as const],
    windowCount: 8,
    objectType: "wohnung" as const,
    floorLevel: "eg" as const,
    elevator: "ja" as const,
    dirtLevel: "normal" as const,
    cleaningSide: "innen_aussen" as const,
    scheduleOption: "1-2_wochen" as const,
    salutation: "Herr",
    firstName: "E2E",
    lastName: "Termin",
    email: "e2e-termin@test.local",
    phone: "021112345678",
    postalCode: "40213",
    city: "Düsseldorf",
    street: "Teststraße",
    houseNumber: "1",
    privacyAccepted: true,
  };
}

export function buildTerminFixtureLead(scenario: TerminFixtureScenario): StoredLead {
  const ctx = defaultQuotePricingContext();
  const quote = buildBaseQuote();
  const anfrageNr = `E2E-${Date.now()}`;
  const snapshot = captureQuotePriceSnapshot(quote, ctx);
  const lead = createQuoteStoredLead(quote, anfrageNr, 0, ctx, snapshot);

  if (scenario === "proposed") {
    lead.status = "termin_vorgeschlagen";
    lead.appointment = {
      proposedDate: futureIso(7),
      timeSlot: "vormittag",
    };
  } else if (scenario === "already_booked") {
    lead.status = "termin_bestaetigt";
    lead.appointment = {
      confirmedDate: futureIso(14),
      confirmedAt: new Date().toISOString(),
      timeSlot: "vormittag",
      plannedStartTime: "09:30",
      estimatedDurationHours: 2,
    };
  } else if (scenario === "wartung_pick") {
    lead.status = "neu";
    lead.quote = {
      ...quote,
      services: ["privat", "wartung"],
      wartungPackageId: "quarterly",
      wartungPreferredWeekday: "di",
      wartungPreferredTimeSlot: "vormittag",
    };
    lead.summary = "E2E Wartung";
  } else {
    lead.status = "neu";
  }

  return lead;
}

export async function seedTerminFixture(scenario: TerminFixtureScenario) {
  const lead = buildTerminFixtureLead(scenario);
  await saveLead(lead);
  const token = createTerminToken(lead.id);
  if (!token) {
    throw new Error("Termin token could not be created (ADMIN_PASSWORD missing).");
  }
  return { lead, token, terminPath: `/termin?token=${encodeURIComponent(token)}` };
}
