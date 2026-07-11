import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveAppointmentsFromLead,
  deriveAppointmentsFromLeads,
  stableAppointmentId,
  withStableIds,
  canRescheduleAppointment,
  mapLeadStatusAfterMove,
  APPOINTMENT_STATUS_LABELS_TR,
  TIME_SLOT_LABELS_TR,
  APPOINTMENT_ROLE_LABELS_TR,
} from "./appointment-from-lead";
import type { StoredLead } from "../leads-store";
import { initialQuoteFormData } from "../quote-form";

function quoteLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "quote-1739123456-abc12",
    source: "quote",
    createdAt: "2026-01-10T10:00:00.000Z",
    name: "Anna Schmidt",
    email: "anna@example.com",
    phone: "+491234",
    summary: "Test",
    photoCount: 0,
    status: "neu",
    anfrageNr: "ANG-2026-001",
    quote: {
      ...initialQuoteFormData,
      services: ["privat"],
      windowCount: 12,
      postalCode: "52499",
      city: "Baesweiler",
      preferredDates: ["2026-03-10", "2026-03-12"],
    },
    ...overrides,
  };
}

describe("deriveAppointmentsFromLead", () => {
  it("creates preferred date events when no confirmed date", () => {
    const items = deriveAppointmentsFromLead(quoteLead());
    assert.equal(items.length, 2);
    assert.equal(items[0].role, "preferred-0");
    assert.equal(items[0].status, "vorgeschlagen");
    assert.equal(items[1].eventDate, "2026-03-12");
  });

  it("creates confirmed and proposed events", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        status: "termin_bestaetigt",
        appointment: { confirmedDate: "2026-04-01", proposedDate: "2026-03-28" },
      })
    );
    assert.equal(items.length, 2);
    assert.equal(items.find((i) => i.role === "confirmed")?.status, "bestätigt");
    assert.equal(items.find((i) => i.role === "proposed")?.status, "vorgeschlagen");
  });

  it("marks completed leads as erledigt", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        status: "abgeschlossen",
        appointment: { confirmedDate: "2026-04-01" },
      })
    );
    assert.equal(items[0].status, "erledigt");
  });

  it("returns empty for rejected leads", () => {
    assert.equal(deriveAppointmentsFromLead(quoteLead({ status: "abgelehnt" })).length, 0);
  });

  it("flags wartung kind when service includes wartung", () => {
    const lead = quoteLead({
      quote: {
        ...initialQuoteFormData,
        services: ["privat", "wartung"],
        windowCount: 8,
        preferredDates: ["2026-03-15"],
        wartungPackageId: "four_weekly",
        wartungPreferredWeekday: "di",
        wartungPreferredTimeSlot: "vormittag",
      },
    });
    assert.equal(deriveAppointmentsFromLead(lead)[0]?.kind, "wartung");
  });

  it("builds stable local ids for kv fallback", () => {
    const items = withStableIds(deriveAppointmentsFromLead(quoteLead()));
    assert.equal(items[0].id, stableAppointmentId("quote-1739123456-abc12", "preferred-0"));
  });
});

describe("canRescheduleAppointment", () => {
  it("allows bestätigt and vorgeschlagen", () => {
    assert.equal(
      canRescheduleAppointment({
        id: "1",
        leadId: "l",
        role: "confirmed",
        kind: "single",
        status: "bestätigt",
        eventDate: "2026-01-01",
        customerName: "A",
        title: "T",
      }),
      true
    );
  });

  it("blocks erledigt", () => {
    assert.equal(
      canRescheduleAppointment({
        id: "1",
        leadId: "l",
        role: "confirmed",
        kind: "single",
        status: "erledigt",
        eventDate: "2026-01-01",
        customerName: "A",
        title: "T",
      }),
      false
    );
  });

  it("blocks storniert", () => {
    assert.equal(
      canRescheduleAppointment({
        id: "1",
        leadId: "l",
        role: "confirmed",
        kind: "single",
        status: "storniert",
        eventDate: "2026-01-01",
        customerName: "A",
        title: "T",
      }),
      false
    );
  });
});

describe("deriveAppointmentsFromLead edge cases", () => {
  it("returns empty for non-quote sources", () => {
    assert.equal(
      deriveAppointmentsFromLead(quoteLead({ source: "contact" })).length,
      0
    );
    assert.equal(
      deriveAppointmentsFromLead(quoteLead({ source: "concierge" })).length,
      0
    );
  });

  it("returns empty when quote has no windowCount", () => {
    assert.equal(deriveAppointmentsFromLead(quoteLead({ quote: {} })).length, 0);
  });

  it("limits preferred dates to three", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        quote: {
          ...initialQuoteFormData,
          services: ["privat"],
          windowCount: 6,
          preferredDates: ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04"],
        },
      })
    );
    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((i) => i.role),
      ["preferred-0", "preferred-1", "preferred-2"]
    );
  });

  it("skips proposed date when same as confirmed", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        appointment: { confirmedDate: "2026-04-01", proposedDate: "2026-04-01" },
      })
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].role, "confirmed");
  });

  it("prefers confirmed over preferred dates", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        appointment: { confirmedDate: "2026-04-01" },
        quote: {
          ...initialQuoteFormData,
          services: ["privat"],
          windowCount: 6,
          preferredDates: ["2026-03-10"],
        },
      })
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].role, "confirmed");
  });

  it("builds title with city and window count", () => {
    const item = deriveAppointmentsFromLead(quoteLead())[0];
    assert.match(item.title, /Anna Schmidt/);
    assert.match(item.title, /12 Flügel/);
    assert.match(item.title, /Baesweiler/);
  });

  it("generates wartung series after confirmed anchor", () => {
    const items = deriveAppointmentsFromLead(
      quoteLead({
        status: "termin_bestaetigt",
        appointment: { confirmedDate: "2026-03-10" },
        quote: {
          ...initialQuoteFormData,
          services: ["privat", "wartung"],
          windowCount: 8,
          wartungPackageId: "quarterly",
          wartungPreferredWeekday: "di",
        },
      })
    );
    const confirmed = items.find((i) => i.role === "confirmed");
    const series = items.filter((i) => String(i.role).startsWith("wartung-"));
    assert.ok(confirmed);
    assert.equal(series.length, 4);
    assert.equal(series[0].role, "wartung-0");
    assert.equal(series[0].status, "bestätigt");
  });

  it("blocks wartung series drag reschedule", () => {
    assert.equal(
      canRescheduleAppointment({
        id: "1",
        leadId: "l",
        role: "wartung-0",
        kind: "wartung",
        status: "bestätigt",
        eventDate: "2026-04-01",
        customerName: "A",
        title: "T",
      }),
      false
    );
  });
});

describe("deriveAppointmentsFromLeads", () => {
  it("flattens multiple leads", () => {
    const items = deriveAppointmentsFromLeads([
      quoteLead({ id: "a", quote: { ...quoteLead().quote!, preferredDates: ["2026-03-10"] } }),
      quoteLead({ id: "b", quote: { ...quoteLead().quote!, preferredDates: ["2026-03-11"] } }),
    ]);
    assert.equal(items.length, 2);
  });
});

describe("mapLeadStatusAfterMove", () => {
  it("promotes active leads to termin_bestaetigt", () => {
    assert.equal(mapLeadStatusAfterMove("neu"), "termin_bestaetigt");
    assert.equal(mapLeadStatusAfterMove("kontaktiert"), "termin_bestaetigt");
  });

  it("leaves terminal statuses unchanged", () => {
    assert.equal(mapLeadStatusAfterMove("abgeschlossen"), undefined);
    assert.equal(mapLeadStatusAfterMove("abgelehnt"), undefined);
  });
});

describe("labels", () => {
  it("covers all appointment statuses in Turkish", () => {
    assert.equal(APPOINTMENT_STATUS_LABELS_TR.bestätigt, "Onaylandı");
    assert.equal(APPOINTMENT_STATUS_LABELS_TR.storniert, "İptal");
  });

  it("covers all calendar time slots in Turkish", () => {
    assert.equal(TIME_SLOT_LABELS_TR.vormittag, "Sabah");
    assert.equal(TIME_SLOT_LABELS_TR.ganztags, "Tüm gün");
  });

  it("covers role labels", () => {
    assert.equal(APPOINTMENT_ROLE_LABELS_TR.confirmed, "Onaylı termin");
    assert.equal(APPOINTMENT_ROLE_LABELS_TR["preferred-0"], "Wunsch 1");
  });
});
