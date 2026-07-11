import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGoogleCalendarAddUrl, isGoogleCalendarLinkVisible } from "./google-calendar";
import type { CalendarAppointment } from "./types";

const sample: CalendarAppointment = {
  id: "1",
  leadId: "l",
  role: "confirmed",
  kind: "single",
  status: "bestätigt",
  eventDate: "2026-03-10",
  customerName: "Anna",
  title: "Anna · Fenster",
  city: "Baesweiler",
};

describe("google-calendar", () => {
  it("builds Google Calendar template URL", () => {
    const url = buildGoogleCalendarAddUrl(sample);
    assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
    assert.match(url, /action=TEMPLATE/);
    assert.match(url, /text=Anna/);
  });

  it("hides link for cancelled appointments", () => {
    assert.equal(isGoogleCalendarLinkVisible({ ...sample, status: "storniert" }), false);
    assert.equal(isGoogleCalendarLinkVisible(sample), true);
  });
});
