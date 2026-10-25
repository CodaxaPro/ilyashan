/**
 * Enterprise proof: chat → bookable quote lead → same booking engine as Termin-Portal.
 * Meta-tests assert the proof suite itself covers fail-closed contracts.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSession } from "@/lib/concierge/types";
import { DEFAULT_STAFF_CONFIG } from "@/lib/staff/config";
import { applyCustomerBooking } from "@/lib/scheduling/booking";
import { canCustomerBookOnline, hasBookableProductData } from "@/lib/lead-product";
import { deriveAppointmentsFromLead } from "@/lib/calendar/appointment-from-lead";
import { materializeBookableLeadFromSession } from "./materialize-bookable-lead";
import { ASSISTANT_TOOL_DEFINITIONS, isAllowlistedTool } from "../tools/registry";
import { buildAssistantSystemPrompt } from "../ai/system-prompt";

const ROOT = join(process.cwd());

describe("chat booking architecture — fail-closed contracts", () => {
  it("rejects concierge-source leads without product upgrade", () => {
    assert.equal(
      canCustomerBookOnline({
        source: "concierge",
        quote: { windowCount: 12 },
      }),
      false
    );
  });

  it("allows quote fenster with windowCount", () => {
    assert.equal(
      canCustomerBookOnline({
        source: "quote",
        quote: { windowCount: 8 },
      }),
      true
    );
  });

  it("materialize fenster → bookable + calendar row after booking", () => {
    const session = createSession("s1");
    session.assistantProduct = "fenster";
    session.quote = { windowCount: 10, floorLevel: "og1", city: "Aachen" };

    const mat = materializeBookableLeadFromSession(session, "Anna Müller", "01731234567");
    assert.equal(mat.ok, true);
    if (!mat.ok) return;

    assert.equal(mat.lead.source, "quote");
    assert.equal(mat.lead.serviceLine, "fenster");
    assert.equal(canCustomerBookOnline(mat.lead), true);
    assert.equal(hasBookableProductData(mat.lead), true);

    const booked = applyCustomerBooking(mat.lead, DEFAULT_STAFF_CONFIG, [], {
      action: "pick_slot",
      date: "2026-06-15",
      timeSlot: "vormittag",
    });
    assert.equal(booked.ok, true);
    assert.equal(booked.status, "termin_bestaetigt");
    assert.equal(booked.appointment?.confirmedDate, "2026-06-15");

    const withAppt = {
      ...mat.lead,
      status: booked.status!,
      appointment: booked.appointment!,
    };
    const cal = deriveAppointmentsFromLead(withAppt);
    assert.ok(cal.some((a) => a.role === "confirmed" && a.eventDate === "2026-06-15"));
  });

  it("materialize treppenhaus complete → bookable calendar", () => {
    const session = createSession("s2");
    session.assistantProduct = "treppenhaus";
    session.treppenhausDraft = {
      stockwerke: 4,
      wohnungen: 8,
      stairTurnus: "biweekly",
      dirtLevel: "normal",
      keller: false,
    };

    const mat = materializeBookableLeadFromSession(session, "Hans Weber", "01739876543");
    assert.equal(mat.ok, true);
    if (!mat.ok) return;

    assert.equal(mat.lead.serviceLine, "treppenhaus");
    assert.ok(mat.lead.treppenhausSnapshot?.input.stockwerke === 4);

    const booked = applyCustomerBooking(mat.lead, DEFAULT_STAFF_CONFIG, [], {
      action: "pick_slot",
      date: "2026-06-16",
      timeSlot: "nachmittag",
    });
    assert.equal(booked.ok, true);

    const cal = deriveAppointmentsFromLead({
      ...mat.lead,
      status: booked.status!,
      appointment: booked.appointment!,
    });
    assert.ok(cal.some((a) => a.title.includes("Treppenhaus")));
  });

  it("materialize buero complete → bookable", () => {
    const session = createSession("s3");
    session.assistantProduct = "buero";
    session.bueroDraft = { totalAreaM2: 120, frequency: "2_PER_WEEK" };

    const mat = materializeBookableLeadFromSession(session, "Büro GmbH Ansprech", "01731112233");
    assert.equal(mat.ok, true);
    if (!mat.ok) return;

    assert.equal(mat.lead.serviceLine, "buero");
    assert.ok(mat.lead.cleaningSnapshot?.input.totalAreaM2 === 120);

    const booked = applyCustomerBooking(mat.lead, DEFAULT_STAFF_CONFIG, [], {
      action: "pick_slot",
      date: "2026-06-17",
      timeSlot: "vormittag",
    });
    assert.equal(booked.ok, true);
  });

  it("fail-closed: incomplete fenster cannot materialize", () => {
    const session = createSession("s4");
    session.assistantProduct = "fenster";
    const mat = materializeBookableLeadFromSession(session, "Test", "01731234567");
    assert.equal(mat.ok, false);
    if (mat.ok) return;
    assert.equal(mat.code, "incomplete_fenster");
  });

  it("fail-closed: praxis/manual products require callback path", () => {
    const session = createSession("s5");
    session.assistantProduct = "praxis";
    const mat = materializeBookableLeadFromSession(session, "Dr. X", "01731234567");
    assert.equal(mat.ok, false);
    if (mat.ok) return;
    assert.equal(mat.code, "manual_review_required");
  });

  it("applyCustomerBooking rejects incomplete treppenhaus quote lead", () => {
    const result = applyCustomerBooking(
      {
        id: "x",
        source: "quote",
        serviceLine: "treppenhaus",
        createdAt: "2026-01-01T00:00:00.000Z",
        name: "X",
        summary: "x",
        photoCount: 0,
        treppenhausSnapshot: undefined,
      },
      DEFAULT_STAFF_CONFIG,
      [],
      { action: "pick_slot", date: "2026-06-20", timeSlot: "vormittag" }
    );
    assert.equal(result.ok, false);
  });
});

describe("P0 tools + prompt contracts", () => {
  it("allowlists book_appointment, request_callback, request_human_handoff", () => {
    for (const name of [
      "book_appointment",
      "request_callback",
      "request_human_handoff",
      "get_available_slots",
      "submit_customer_lead",
    ]) {
      assert.equal(isAllowlistedTool(name), true, name);
    }
    const names = ASSISTANT_TOOL_DEFINITIONS.map((t) => t.name);
    assert.ok(names.includes("book_appointment"));
    assert.ok(names.includes("request_callback"));
    assert.ok(names.includes("request_human_handoff"));
  });

  it("system prompt mandates book_appointment not wishful propose", () => {
    const prompt = buildAssistantSystemPrompt();
    assert.match(prompt, /book_appointment/);
    assert.match(prompt, /request_callback/);
    assert.match(prompt, /request_human_handoff/);
    assert.match(prompt, /VERBINDLICH|verbindlich/i);
  });
});

describe("meta-tests — proof suite integrity", () => {
  it("this proof file exists and is wired into npm test", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      scripts: { test: string };
    };
    assert.match(
      pkg.scripts.test,
      /chat-booking-proof\.test\.ts/,
      "chat-booking-proof must be in npm test script"
    );
  });

  it("booking engine still rejects non-quote sources (no silent bypass)", () => {
    const result = applyCustomerBooking(
      {
        id: "c1",
        source: "concierge",
        createdAt: "2026-01-01T00:00:00.000Z",
        name: "X",
        summary: "x",
        photoCount: 0,
        quote: { windowCount: 10 },
      },
      DEFAULT_STAFF_CONFIG,
      [],
      { action: "pick_slot", date: "2026-06-20", timeSlot: "vormittag" }
    );
    assert.equal(result.ok, false);
  });

  it("materialize + booking modules are present (no stub)", () => {
    const bookSrc = readFileSync(
      join(ROOT, "lib/assistant/sales/book-from-chat.ts"),
      "utf8"
    );
    const matSrc = readFileSync(
      join(ROOT, "lib/assistant/sales/materialize-bookable-lead.ts"),
      "utf8"
    );
    assert.match(bookSrc, /applyCustomerBooking/);
    assert.match(bookSrc, /syncLeadToCalendar/);
    assert.match(matSrc, /source: "quote"/);
    assert.match(matSrc, /buildTreppenhausSnapshot|buildCleaningQuoteSnapshot/);
  });

  it("widget exposes 1-tap call and callback controls", () => {
    const widget = readFileSync(join(ROOT, "components/ConciergeWidget.tsx"), "utf8");
    assert.match(widget, /concierge-call-now/);
    assert.match(widget, /concierge-callback-tap/);
    assert.match(widget, /concierge-whatsapp-tap/);
    assert.match(widget, /forceLeadForm/);
  });
});
