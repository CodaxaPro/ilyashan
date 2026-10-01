/**
 * P3 parity proofs: buero lead identity, calendar derive, festpreis default,
 * completeness without windowCount.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCleaningStoredLead } from "./lead-bridge";
import { buildCleaningQuoteSnapshot, generateCleaningQuoteReference } from "./snapshot";
import { calculateOfficeCleaningQuote } from "./calculate";
import { DEFAULT_CLEANING_CONFIG } from "./seed-config";
import { FIXTURE_B_NORMAL } from "./fixtures";
import { normalizeContactInput } from "./normalize-input";
import { deriveAppointmentsFromLead } from "@/lib/calendar/appointment-from-lead";
import { getDefaultFestpreis } from "@/lib/festpreis";
import {
  isBueroLead,
  isCompleteQuoteLead,
  resolveLeadEstimatedHours,
} from "@/lib/lead-product";
import { buildTerminPortalSummary } from "@/lib/termin-portal";
import { isReminderEligibleLead } from "@/lib/scheduling/appointment-reminders";
import { applyCustomerBooking } from "@/lib/scheduling/booking";
import { DEFAULT_STAFF_CONFIG } from "@/lib/staff/config";

function sampleBueroLead() {
  const calc = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL, DEFAULT_CLEANING_CONFIG);
  const contact = normalizeContactInput({
    company: "Test GmbH",
    contactPerson: "Ada Lovelace",
    email: "ada@test.de",
    phone: "0241",
    street: "Markt 1",
    postalCode: "52062",
    city: "Aachen",
    privacyNoticeAccepted: true,
  });
  assert.ok(contact);
  const snap = buildCleaningQuoteSnapshot({
    quoteReference: generateCleaningQuoteReference(),
    input: FIXTURE_B_NORMAL,
    contact,
    calc,
    config: DEFAULT_CLEANING_CONFIG,
  });
  return createCleaningStoredLead(snap);
}

describe("cleaning/P3 CRM parity", () => {
  it("creates buero lead without windowCount", () => {
    const lead = sampleBueroLead();
    assert.equal(lead.serviceLine, "buero");
    assert.equal(lead.source, "quote");
    assert.equal(lead.quote?.windowCount, undefined);
    assert.ok(isBueroLead(lead));
    assert.ok(isCompleteQuoteLead(lead));
    assert.ok(lead.cleaningSnapshot?.customer.netCents);
  });

  it("calendar derives confirmed/proposed for buero", () => {
    const lead = sampleBueroLead();
    lead.appointment = {
      proposedDate: "2026-04-10",
      confirmedDate: "2026-04-12",
      timeSlot: "vormittag",
    };
    const rows = deriveAppointmentsFromLead(lead);
    assert.ok(rows.some((r) => r.role === "confirmed"));
    assert.ok(rows.some((r) => r.role === "proposed"));
    assert.ok(rows[0].title.includes("Büro"));
    assert.equal(rows[0].windowCount, undefined);
  });

  it("festpreis default uses cleaning gross", () => {
    const lead = sampleBueroLead();
    const fp = getDefaultFestpreis(lead);
    assert.ok(typeof fp === "number" && fp > 0);
    assert.equal(fp, Math.round(lead.cleaningSnapshot!.customer.grossCents / 100));
  });

  it("termin portal summary works without Flügel", () => {
    const lead = sampleBueroLead();
    const summary = buildTerminPortalSummary(lead);
    assert.ok(summary);
    assert.equal(summary?.servicesLabel, "Büroreinigung");
    assert.equal(summary?.canDownloadPdf, false);
  });

  it("reminder eligibility accepts buero without windowCount", () => {
    const lead = sampleBueroLead();
    lead.email = "ada@test.de";
    lead.status = "termin_bestaetigt";
    lead.appointment = { confirmedDate: "2026-04-20" };
    const check = isReminderEligibleLead(lead, "2026-04-20");
    assert.equal(check.eligible, true);
  });

  it("customer booking works for buero lead", () => {
    const lead = sampleBueroLead();
    lead.appointment = { proposedDate: "2026-05-05", timeSlot: "flexibel" };
    const result = applyCustomerBooking(lead, DEFAULT_STAFF_CONFIG, [lead], {
      action: "confirm_proposed",
    });
    assert.equal(result.ok, true);
    assert.equal(result.status, "termin_bestaetigt");
    assert.equal(result.appointment?.confirmedDate, "2026-05-05");
    assert.ok(resolveLeadEstimatedHours(lead) > 0);
  });

  it("fenster incomplete still fails without windowCount", () => {
    assert.equal(
      isCompleteQuoteLead({
        source: "quote",
        quote: { firstName: "A" },
      }),
      false
    );
  });
});
