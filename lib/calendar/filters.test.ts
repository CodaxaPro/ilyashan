import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CALENDAR_FILTERS,
  countAppointmentsByStatus,
  filterCalendarAppointments,
  isPreferredRole,
  parseCalendarFilters,
} from "./filters";
import type { CalendarAppointment } from "./types";

function appt(overrides: Partial<CalendarAppointment> = {}): CalendarAppointment {
  return {
    id: "1",
    leadId: "l1",
    role: "confirmed",
    kind: "single",
    status: "bestätigt",
    eventDate: "2026-03-10",
    customerName: "Anna Schmidt",
    city: "Baesweiler",
    postalCode: "52499",
    title: "Anna · 8 Flügel",
    ...overrides,
  };
}

describe("calendar filters", () => {
  it("filters by status, kind, and search", () => {
    const items = [
      appt(),
      appt({ id: "2", status: "vorgeschlagen", role: "proposed", kind: "wartung", customerName: "Max", postalCode: "52072" }),
    ];
    assert.equal(filterCalendarAppointments(items, { ...DEFAULT_CALENDAR_FILTERS, status: "bestätigt" }).length, 1);
    assert.equal(filterCalendarAppointments(items, { ...DEFAULT_CALENDAR_FILTERS, kind: "wartung" }).length, 1);
    assert.equal(
      filterCalendarAppointments(items, { ...DEFAULT_CALENDAR_FILTERS, search: "52499" }).length,
      1
    );
  });

  it("actionable role hides preferred unless confirmed", () => {
    const items = [
      appt({ role: "preferred-0", status: "vorgeschlagen" }),
      appt({ id: "2", role: "confirmed", status: "bestätigt" }),
    ];
    assert.equal(
      filterCalendarAppointments(items, { ...DEFAULT_CALENDAR_FILTERS, role: "actionable" }).length,
      1
    );
  });

  it("parses URL params", () => {
    const params = new URLSearchParams("status=bestätigt&kind=wartung&search=anna&role=confirmed");
    const filters = parseCalendarFilters(params);
    assert.equal(filters.status, "bestätigt");
    assert.equal(filters.kind, "wartung");
    assert.equal(filters.search, "anna");
    assert.equal(filters.role, "confirmed");
  });

  it("detects preferred roles", () => {
    assert.equal(isPreferredRole("preferred-1"), true);
    assert.equal(isPreferredRole("confirmed"), false);
  });

  it("counts by status without applying status filter", () => {
    const items = [
      appt({ status: "bestätigt" }),
      appt({ id: "2", status: "vorgeschlagen", role: "proposed" }),
      appt({ id: "3", status: "vorgeschlagen", role: "proposed" }),
      appt({ id: "4", status: "storniert" }),
    ];
    const counts = countAppointmentsByStatus(items, {
      ...DEFAULT_CALENDAR_FILTERS,
      status: "bestätigt",
    });
    assert.equal(counts.bestätigt, 1);
    assert.equal(counts.vorgeschlagen, 2);
    assert.equal(counts.storniert, 1);
    assert.equal(counts.erledigt, 0);
  });
});
