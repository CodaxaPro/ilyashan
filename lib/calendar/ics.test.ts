import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildIcsCalendar, buildIcsEvent, appointmentToGoogleDates } from "./ics";
import type { CalendarAppointment } from "./types";

const sample: CalendarAppointment = {
  id: "evt-1",
  leadId: "lead-1",
  role: "confirmed",
  kind: "wartung",
  status: "bestätigt",
  eventDate: "2026-03-10",
  timeSlot: "vormittag",
  customerName: "Anna Schmidt",
  customerPhone: "+49123456789",
  anfrageNr: "ANG-2026-001",
  city: "Baesweiler",
  postalCode: "52499",
  title: "Anna Schmidt · 8 Flügel · Baesweiler",
};

describe("ics", () => {
  it("builds all-day dates for flexibel slot", () => {
    const dates = appointmentToGoogleDates({ ...sample, timeSlot: "flexibel" });
    assert.equal(dates.allDay, true);
    assert.equal(dates.start, "20260310");
    assert.equal(dates.end, "20260311");
  });

  it("builds timed dates for vormittag", () => {
    const dates = appointmentToGoogleDates(sample);
    assert.equal(dates.allDay, false);
    assert.ok(dates.start.length >= 15);
  });

  it("serializes VEVENT block", () => {
    const block = buildIcsEvent(sample, "ilyashan.de");
    assert.match(block, /BEGIN:VEVENT/);
    assert.match(block, /SUMMARY:Anna Schmidt/);
    assert.match(block, /END:VEVENT/);
  });

  it("builds full calendar document", () => {
    const ics = buildIcsCalendar([sample], {
      calendarName: "Ilyashan Termine",
      uidHost: "ilyashan.de",
    });
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /END:VCALENDAR/);
    assert.doesNotMatch(ics, /CANCELLED/);
  });

  it("excludes storniert events", () => {
    const ics = buildIcsCalendar([{ ...sample, status: "storniert" }], {
      calendarName: "Test",
      uidHost: "ilyashan.de",
    });
    assert.doesNotMatch(ics, /BEGIN:VEVENT/);
  });
});
