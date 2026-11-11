import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { initialQuoteFormData } from "./quote-form";
import {
  canProceedQuoteStep,
  hasPrimaryService,
  isQuoteSubmissionValid,
  normalizeServices,
  syncServicesWithObjectType,
  validateQuoteStep,
} from "./quote-validation";

describe("quote-validation – Services", () => {
  it("normalisiert reine Wartung zu Privat+Wartung", () => {
    assert.equal(hasPrimaryService(["wartung"]), false);
    assert.deepEqual(normalizeServices(["wartung"]), ["privat", "wartung"]);
    assert.equal(hasPrimaryService(normalizeServices(["wartung"])), true);
  });

  it("normalisiert Privat+Gewerbe Konflikt", () => {
    assert.deepEqual(normalizeServices(["privat", "gewerbe"]), ["gewerbe"]);
    assert.deepEqual(normalizeServices(["privat", "wartung"]), ["privat", "wartung"]);
    assert.deepEqual(normalizeServices([]), ["privat"]);
  });

  it("Wartung ohne Paket blockiert Schritt 1", () => {
    assert.equal(
      canProceedQuoteStep(1, {
        ...initialQuoteFormData,
        services: ["privat", "wartung"],
      }),
      false
    );
  });

  it("Wartung mit Paket + Wochentag erlaubt Schritt 1", () => {
    assert.equal(
      canProceedQuoteStep(1, {
        ...initialQuoteFormData,
        services: ["privat", "wartung"],
        wartungPackageId: "quarterly",
        wartungPreferredWeekday: "di",
        wartungPreferredTimeSlot: "vormittag",
      }),
      true
    );
  });
});

describe("quote-validation – Schritte", () => {
  const valid = {
    ...initialQuoteFormData,
    services: ["privat"] as import("./quote-form").QuoteServiceId[],
    objectType: "wohnung" as const,
    floorLevel: "eg" as const,
    elevator: "ja" as const,
    scheduleOption: "1-2_wochen" as const,
    firstName: "Max",
    lastName: "Muster",
    phone: "01701234567",
    postalCode: "52499",
    city: "Baesweiler",
    privacyAccepted: true,
  };

  it("Schritt 1–5 durchlaufbar bei gültigen Daten", () => {
    for (let step = 1; step <= 5; step++) {
      assert.equal(canProceedQuoteStep(step, valid), true, `Schritt ${step}`);
    }
    assert.equal(isQuoteSubmissionValid(valid), true);
  });

  it("Schritt 2: Etage und Aufzug Pflicht", () => {
    const issues = validateQuoteStep(2, {
      ...valid,
      floorLevel: "",
      elevator: "",
    });
    assert.ok(issues.some((i) => i.field === "floorLevel"));
    assert.ok(issues.some((i) => i.field === "elevator"));
  });

  it("Schritt 3: Solar ohne m² blockiert", () => {
    assert.equal(
      canProceedQuoteStep(3, { ...valid, includeSolar: true, solarSqm: 0 }),
      false
    );
  });

  it("Objektart Gewerbe synchronisiert Service-Label", () => {
    assert.deepEqual(syncServicesWithObjectType(["privat", "wartung"], "gewerbe"), [
      "gewerbe",
      "wartung",
    ]);
    assert.deepEqual(syncServicesWithObjectType(["gewerbe"], "wohnung"), ["privat"]);
    assert.equal(
      canProceedQuoteStep(2, {
        ...valid,
        services: ["gewerbe"],
        objectType: "gewerbe",
      }),
      true
    );
  });

  it("API: unvollständige Kontaktdaten blockiert", () => {
    assert.equal(isQuoteSubmissionValid({ ...valid, phone: "" }), false);
  });
});
