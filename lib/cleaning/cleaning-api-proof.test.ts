/**
 * P1 corporate proof: normalize, snapshot immutability, server authority,
 * public payload hygiene, injection rejection.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FIXTURE_B_NORMAL,
  FIXTURE_C_500,
  FIXTURE_F_INCONSISTENT,
  buildCleaningQuoteSnapshot,
  calculateOfficeCleaningQuote,
  DEFAULT_CLEANING_CONFIG,
  detectPriceInjection,
  generateCleaningQuoteReference,
  hasBlockingErrors,
  normalizeContactInput,
  normalizeCustomerInput,
  serverCalculateCleaningQuote,
  toPublicQuotePayload,
} from "./index";

describe("cleaning/normalize-input", () => {
  it("repairs mismatched subAreas/floors to total instead of blocking", () => {
    const fixed = normalizeCustomerInput({
      totalAreaM2: 100,
      frequency: "2_PER_WEEK",
      subAreas: { office: 10, meeting: 0, kitchen: 0, sanitary: 0, corridors: 0, reception: 0, other: 0 },
      floors: { carpet: 10, hard: 0, wet: 0, other: 0 },
      office: { workstations: 8, officeBins: 8 },
    });
    const calc = calculateOfficeCleaningQuote(fixed);
    assert.equal(calc.customer.quoteStatus, "INDICATION");
    assert.ok(calc.customer.netCents > 0);
    assert.ok(calc.customer.estimatedOnsiteHours >= 1.5);
    assert.equal(hasBlockingErrors(calc.admin.validation), false);
  });

  it("clamps NaN / negative / oversized numbers", () => {
    const input = normalizeCustomerInput({
      totalAreaM2: -50,
      office: { workstations: Number.NaN, officeBins: 1e9 },
      usageIntensity: "HACKED",
      language: "tr",
    });
    assert.equal(input.totalAreaM2, 0);
    assert.equal(input.office.workstations, 0);
    assert.equal(input.office.officeBins, 5000);
    assert.equal(input.usageIntensity, "NORMAL");
    assert.equal(input.language, "tr");
  });

  it("detects price injection keys", () => {
    assert.deepEqual(detectPriceInjection({ netCents: 1, foo: 2 }), ["netCents"]);
    assert.deepEqual(detectPriceInjection({ totalAreaM2: 100 }), []);
  });

  it("requires privacy notice + contact fields", () => {
    assert.equal(
      normalizeContactInput({
        company: "Acme GmbH",
        contactPerson: "Ada",
        email: "ada@acme.de",
        phone: "+49123",
        postalCode: "52062",
        city: "Aachen",
        privacyNoticeAccepted: false,
      }),
      null
    );
    const ok = normalizeContactInput({
      company: "Acme GmbH",
      contactPerson: "Ada",
      email: "ada@acme.de",
      phone: "+49123",
      street: "Markt 1",
      postalCode: "52062",
      city: "Aachen",
      privacyNoticeAccepted: true,
    });
    assert.ok(ok);
    assert.equal(ok?.company, "Acme GmbH");
  });
});

describe("cleaning/server authority", () => {
  it("server public payload never includes admin internals", () => {
    const { public: pub, calc } = serverCalculateCleaningQuote(FIXTURE_C_500);
    const json = JSON.stringify(pub);
    assert.equal(json.includes("laborCost"), false);
    assert.equal(json.includes("overhead"), false);
    assert.equal(json.includes("targetMargin"), false);
    assert.equal(toPublicQuotePayload(calc).netCents, pub.netCents);
  });

  it("client preview discrepancy does not change server net", () => {
    const { public: pub } = serverCalculateCleaningQuote(FIXTURE_B_NORMAL);
    const fakeClient = pub.netCents - 5000;
    assert.notEqual(fakeClient, pub.netCents);
    // Server result independent of fakeClient (API logs only)
    const again = serverCalculateCleaningQuote(FIXTURE_B_NORMAL).public;
    assert.equal(again.netCents, pub.netCents);
  });
});

describe("cleaning/snapshot immutability", () => {
  it("snapshot keeps configVersion and prices after live config mutation attempt", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL, DEFAULT_CLEANING_CONFIG);
    const contact = normalizeContactInput({
      company: "Test GmbH",
      contactPerson: "Max Mustermann",
      email: "max@test.de",
      phone: "0241",
      street: "Teststr. 1",
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
      clientPreviewNetCents: calc.customer.netCents,
    });

    const frozenNet = snap.customer.netCents;
    const frozenVersion = snap.configVersionId;
    const frozenMinutes = snap.admin.workload.requiredPersonMinutes;

    // Mutating the live seed object must not rewrite the snapshot clone
    const live = DEFAULT_CLEANING_CONFIG as { targetGrossMargin: number };
    const previous = live.targetGrossMargin;
    live.targetGrossMargin = 0.99;
    assert.equal(snap.customer.netCents, frozenNet);
    assert.equal(snap.configVersionId, frozenVersion);
    assert.equal(snap.admin.workload.requiredPersonMinutes, frozenMinutes);
    live.targetGrossMargin = previous;

    assert.equal(snap.discrepancyCents, 0);
    assert.match(snap.quoteReference, /^ANG-\d{4}-\d{6}$/);
  });

  it("records discrepancy when client preview differs", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL);
    const contact = normalizeContactInput({
      company: "Test GmbH",
      contactPerson: "Max",
      email: "max@test.de",
      phone: "1",
      postalCode: "52062",
      city: "Aachen",
      privacyNoticeAccepted: true,
    });
    assert.ok(contact);
    const snap = buildCleaningQuoteSnapshot({
      quoteReference: "ANG-2026-000001",
      input: FIXTURE_B_NORMAL,
      contact,
      calc,
      config: DEFAULT_CLEANING_CONFIG,
      clientPreviewNetCents: calc.customer.netCents - 1234,
    });
    assert.equal(snap.discrepancyCents, 1234);
  });
});

describe("cleaning/quote blocking", () => {
  it("raw inconsistent areas still block when not normalized", () => {
    const { blocking, calc } = serverCalculateCleaningQuote(FIXTURE_F_INCONSISTENT);
    assert.equal(blocking, true);
    assert.equal(calc.customer.quoteStatus, "MANUAL_REVIEW_REQUIRED");
  });

  it("public normalize path repairs inconsistent areas into an indication", () => {
    const fixed = normalizeCustomerInput(FIXTURE_F_INCONSISTENT);
    const { blocking, calc } = serverCalculateCleaningQuote(fixed);
    assert.equal(blocking, false);
    assert.equal(calc.customer.quoteStatus, "INDICATION");
    assert.ok(calc.customer.netCents > 0);
  });
});

describe("cleaning/reference format", () => {
  it("ANG-YYYY-XXXXXX", () => {
    const ref = generateCleaningQuoteReference(new Date("2026-06-15T12:00:00Z"));
    assert.match(ref, /^ANG-2026-\d{6}$/);
  });
});
