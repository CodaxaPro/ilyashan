/**
 * End-to-end surface proof: extras + VAT must match across
 * research → engine → reference → UI hints → summary → WhatsApp →
 * termin portal → concierge → emails → Step3 UX copy.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculatePriceEstimate } from "./pricing";
import { referencePriceBreakdown } from "./pricing-reference";
import {
  EXTRAS_RESEARCH,
  RECOMMENDED_PRICING as P,
} from "./pricing-market-research";
import {
  extraPriceHints,
  initialQuoteFormData,
  type QuoteFormData,
} from "./quote-form";
import { formatCanopyHint, formatNarrowStairsHint } from "./pricing-display";
import {
  captureQuotePriceSnapshot,
  createQuotePricingContext,
} from "./quote-pricing-context";
import { DEFAULT_FENSTER_PRICING } from "./pricing-config";
import {
  getPriceLabel,
  getReinigungswünscheLabel,
  buildQuoteTableRows,
} from "./quote-summary";
import { buildWhatsAppQuoteMessage } from "./whatsapp-quote";
import { buildPriceResponse } from "./concierge/pricing-response";
import { buildTerminPortalSummary } from "./termin-portal";
import {
  buildAppointmentConfirmationEmail,
  buildAppointmentReminderEmail,
  getCustomerEmailPreviewDe,
} from "./appointment-email";
import {
  formatEstimateAmountLabel,
  formatEstimateRangeLabel,
  formatFestpreisBreakdownLines,
  formatFestpreisDisplay,
  formatFestpreisEmailLine,
  formatFestpreisHtmlInner,
  resolvePriceAudience,
  splitBrutto,
  vatFootnote,
  VAT_PERCENT_LABEL,
} from "./vat-display";
import type { StoredLead } from "./leads-store";

const ctx = createQuotePricingContext(DEFAULT_FENSTER_PRICING);

function base(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "haus",
    floorLevel: "eg",
    elevator: "ja",
    windowCount: 10,
    dirtLevel: "normal",
    cleaningSide: "innen_aussen",
    roomHeight: 2.5,
    firstName: "Anna",
    lastName: "Schmidt",
    postalCode: "52499",
    city: "Baesweiler",
    ...overrides,
  };
}

function leadFromQuote(
  quote: QuoteFormData,
  overrides: Partial<StoredLead> = {}
): StoredLead {
  const snapshot = captureQuotePriceSnapshot(quote, ctx)!;
  return {
    id: "lead-e2e",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna Schmidt",
    email: "anna@test.de",
    summary: "e2e",
    photoCount: 0,
    quote,
    priceSnapshot: snapshot,
    status: "termin_bestaetigt",
    ...overrides,
  };
}

/** Locked extras table after market pass – fail loudly if silently changed. */
const EXPECTED_PER_FLUEGEL = {
  withFrame: 2.1,
  withFalz: 1.5,
  windowSills: 1.5,
  muntinWindows: 4.5,
  oldBuildingWindows: 4.0,
  shutters: 6.0,
  blinds: 6.0,
} as const;

const EXPECTED_FLAT = {
  skylights: 18,
  flyScreens: 12,
  canopy: 39,
  canopyPerSqm: 8.0,
  narrowStairs: 15,
} as const;

describe("E2E – locked extras constants", () => {
  it("per-Flügel extras match locked table + research", () => {
    for (const [key, value] of Object.entries(EXPECTED_PER_FLUEGEL)) {
      const k = key as keyof typeof EXPECTED_PER_FLUEGEL;
      assert.equal(P.extrasPerFluegel[k], value, `engine ${key}`);
      assert.equal(EXTRAS_RESEARCH[k].perFluegel, value, `research ${key}`);
    }
  });

  it("flat extras match locked table + research", () => {
    assert.equal(P.extrasFlat.skylights, EXPECTED_FLAT.skylights);
    assert.equal(P.extrasFlat.flyScreens, EXPECTED_FLAT.flyScreens);
    assert.equal(P.extrasFlat.canopy, EXPECTED_FLAT.canopy);
    assert.equal(P.extrasFlat.canopyPerSqm, EXPECTED_FLAT.canopyPerSqm);
    assert.equal(P.extrasFlat.narrowStairs, EXPECTED_FLAT.narrowStairs);
    assert.equal(EXTRAS_RESEARCH.skylights.perUnit, EXPECTED_FLAT.skylights);
    assert.equal(EXTRAS_RESEARCH.flyScreens.perUnit, EXPECTED_FLAT.flyScreens);
    assert.equal(EXTRAS_RESEARCH.canopy.perUnit, EXPECTED_FLAT.canopy);
    assert.equal(EXTRAS_RESEARCH.canopy.marketPerSqm, EXPECTED_FLAT.canopyPerSqm);
  });

  it("no stray flyScreens left in per-Flügel map", () => {
    assert.equal("flyScreens" in P.extrasPerFluegel, false);
  });
});

describe("E2E – UI hints ↔ engine", () => {
  function parseEuro(hint: string, pattern: RegExp): number {
    const match = hint.match(pattern);
    assert.ok(match, `pattern miss in "${hint}"`);
    return Number.parseFloat(match[1].replace(",", "."));
  }

  it("every per-Flügel hint shows exact engine price", () => {
    for (const key of Object.keys(EXPECTED_PER_FLUEGEL) as (keyof typeof EXPECTED_PER_FLUEGEL)[]) {
      const hint = extraPriceHints[key];
      assert.ok(hint, `hint missing ${key}`);
      assert.equal(
        parseEuro(hint, /\+([\d,]+)\s*€\/Flügel/),
        P.extrasPerFluegel[key]
      );
    }
  });

  it("flat / special hints show exact engine prices", () => {
    assert.equal(
      parseEuro(extraPriceHints.skylights, /\+([\d,]+)\s*€ pauschal/),
      P.extrasFlat.skylights
    );
    assert.equal(
      parseEuro(extraPriceHints.flyScreens, /\+([\d,]+)\s*€ pauschal/),
      P.extrasFlat.flyScreens
    );
    assert.equal(
      parseEuro(extraPriceHints.narrowStairs, /\+([\d,]+)\s*€ pauschal/),
      P.extrasFlat.narrowStairs
    );
    assert.match(extraPriceHints.canopy, /ab 39 €/);
    assert.match(extraPriceHints.canopy, /8,00 €\/m²/);
    assert.match(extraPriceHints.canopy, /nur Glas/);
    assert.equal(formatCanopyHint(), "8,00 €/m² · mindestens 39,00 €");
    assert.equal(formatNarrowStairsHint(), "+15,00 € pauschal");
  });

  it("UX constraint copy is present in hints", () => {
    assert.match(extraPriceHints.shutters, /Innenreinigung|nur innen/i);
    assert.match(extraPriceHints.shutters, /außen nicht/i);
    assert.match(extraPriceHints.blinds, /innenliegende Jalousien/i);
    assert.match(extraPriceHints.flyScreens, /ausgebaut|innen zugänglich/i);
    assert.match(extraPriceHints.canopy, /nur Glas/i);
  });
});

describe("E2E – calculation amounts", () => {
  it("each per-Flügel extra alone = n × unit", () => {
    const n = 10;
    for (const [key, unit] of Object.entries(EXPECTED_PER_FLUEGEL)) {
      const est = calculatePriceEstimate(base({ windowCount: n, [key]: true }))!;
      const line = est.breakdown.find((l) => l.detail?.includes(`${unit.toFixed(2)} €`));
      assert.ok(line, `breakdown line for ${key}`);
      assert.equal(line!.amount, n * unit);
    }
  });

  it("skylights / flyScreens / narrowStairs are pauschal (ignore windowCount)", () => {
    for (const n of [1, 20, 40]) {
      const sky = calculatePriceEstimate(base({ windowCount: n, skylights: true }))!;
      const fly = calculatePriceEstimate(base({ windowCount: n, flyScreens: true }))!;
      const stairs = calculatePriceEstimate(base({ windowCount: n, narrowStairs: true }))!;
      assert.equal(
        sky.breakdown.find((l) => l.label.includes("Dachfenster"))!.amount,
        18
      );
      assert.equal(
        fly.breakdown.find((l) => l.label.includes("Fliegengitter"))!.amount,
        12
      );
      assert.equal(
        stairs.breakdown.find((l) => l.label === "Enge Treppe")!.amount,
        15
      );
    }
  });

  it("canopy = max(min, sqm × rate)", () => {
    const small = calculatePriceEstimate(base({ canopy: true, canopySqm: 3 }))!;
    assert.equal(
      small.breakdown.find((l) => l.label.includes("Vordach"))!.amount,
      39
    );
    const big = calculatePriceEstimate(base({ canopy: true, canopySqm: 8 }))!;
    assert.equal(
      big.breakdown.find((l) => l.label.includes("Vordach"))!.amount,
      64
    );
  });

  it("kitchen-sink: all extras – engine ≡ reference ≡ exact sum", () => {
    const data = base({
      windowCount: 10,
      withFrame: true,
      withFalz: true,
      windowSills: true,
      muntinWindows: true,
      oldBuildingWindows: true,
      shutters: true,
      blinds: true,
      skylights: true,
      flyScreens: true,
      canopy: true,
      canopySqm: 8,
      narrowStairs: true,
    });
    const expectedExtras =
      10 * (2.1 + 1.5 + 1.5 + 4.5 + 4.0 + 6.0 + 6.0) + 18 + 12 + 64 + 15;
    assert.equal(expectedExtras, 365);

    const est = calculatePriceEstimate(data)!;
    const ref = referencePriceBreakdown(data);
    assert.equal(ref.extrasTotal, 365);
    assert.equal(est.calculatedSubtotal, ref.calculatedSubtotal);
    assert.equal(est.calculatedSubtotal, 50 + 365);

    const shutterLine = est.breakdown.find((l) => l.label.includes("Rollläden"));
    assert.ok(shutterLine);
    assert.match(shutterLine!.detail ?? "", /nur innen/);
    assert.match(shutterLine!.label, /nur innen/);

    const canopyLine = est.breakdown.find((l) => l.label.includes("Vordach"));
    assert.match(canopyLine!.label, /nur Glas/);

    const flyLine = est.breakdown.find((l) => l.label.includes("Fliegengitter"));
    assert.match(flyLine!.detail ?? "", /pauschal/);
    assert.match(flyLine!.detail ?? "", /innen zugänglich/);

    const blindsLine = est.breakdown.find((l) => l.label.includes("Jalousien"));
    assert.match(blindsLine!.label, /innenliegend/);
  });
});

describe("E2E – quote summary / PDF rows / snapshot", () => {
  it("reinigungswünsche labels carry UX constraints", () => {
    const data = base({
      shutters: true,
      blinds: true,
      canopy: true,
      flyScreens: true,
    });
    const label = getReinigungswünscheLabel(data);
    assert.match(label, /Rollladen \(nur innen/);
    assert.match(label, /Jalousien \(innenliegend\)/);
    assert.match(label, /nur Glas/);
    assert.match(label, /Fliegengitter \(pauschal\)/);
  });

  it("price label privat vs gewerbe on same brutto numbers", () => {
    const privat = base();
    const gewerbe = base({ services: ["gewerbe"], objectType: "gewerbe" });
    const estP = calculatePriceEstimate(privat)!;
    const estG = calculatePriceEstimate(gewerbe)!;
    // Amounts may differ by model; labels must use correct VAT wording
    assert.match(getPriceLabel(privat), /inkl\. MwSt/);
    assert.doesNotMatch(getPriceLabel(privat), /Netto/);
    assert.match(getPriceLabel(gewerbe), /Netto/);
    assert.match(getPriceLabel(gewerbe), /zzgl\. 19 % MwSt/);
    assert.match(getPriceLabel(gewerbe), /Brutto/);

    const snapP = captureQuotePriceSnapshot(privat, ctx)!;
    const snapG = captureQuotePriceSnapshot(gewerbe, ctx)!;
    assert.match(snapP.priceLabel, /inkl\. MwSt/);
    assert.match(snapG.priceLabel, /Netto/);
    assert.equal(estP.amount, snapP.amount);
    assert.equal(estG.amount, snapG.amount);
  });

  it("quote table rows include price with MwSt wording", () => {
    const rows = buildQuoteTableRows(base({ shutters: true, flyScreens: true }), "ANG-E2E");
    const priceRow = rows.find((r) => /Preis|Schätzung|Richtwert/i.test(r[0]));
    assert.ok(priceRow, `price row missing: ${JSON.stringify(rows)}`);
    assert.match(priceRow![1], /inkl\. MwSt/);
    const extrasRow = rows.find((r) => r[0] === "Reinigungswünsche");
    assert.ok(extrasRow);
    assert.match(extrasRow![1], /Rollladen/);
    assert.match(extrasRow![1], /Fliegengitter/);
  });
});

describe("E2E – WhatsApp + concierge + termin portal", () => {
  it("WhatsApp privat: inkl. MwSt; gewerbe: Netto/Brutto", () => {
    const privatMsg = buildWhatsAppQuoteMessage(base({ windowCount: 12 }));
    assert.match(privatMsg, /inkl\. MwSt/);
    assert.doesNotMatch(privatMsg, /Netto ca\./);

    const gewerbeMsg = buildWhatsAppQuoteMessage(
      base({ services: ["gewerbe"], objectType: "gewerbe", windowCount: 20 })
    );
    assert.match(gewerbeMsg, /Netto/);
    assert.match(gewerbeMsg, /Brutto/);
    assert.match(gewerbeMsg, /zzgl\. 19 % MwSt/);
  });

  it("concierge price response uses VAT footnote + same estimate", () => {
    const privat = buildPriceResponse({
      services: ["privat"],
      windowCount: 12,
      floorLevel: "eg",
      objectType: "haus",
    })!;
    assert.match(privat, /inkl\. MwSt/);
    assert.match(privat, /Privat: Alle Preise inkl\. MwSt/);

    const gewerbe = buildPriceResponse({
      services: ["gewerbe"],
      windowCount: 20,
      floorLevel: "eg",
      objectType: "gewerbe",
    })!;
    assert.match(gewerbe, /Netto/);
    assert.match(gewerbe, /zzgl\. 19 % MwSt/);
    assert.match(gewerbe, /Gewerbe:/);
  });

  it("termin portal prefers Festpreis label with audience VAT", () => {
    const privatLead = leadFromQuote(base(), { festpreis: 125 });
    const privatSummary = buildTerminPortalSummary(privatLead)!;
    assert.match(privatSummary.priceLabel ?? "", /Festpreis:.*inkl\. MwSt/);

    const gewerbeLead = leadFromQuote(
      base({ services: ["gewerbe"], objectType: "gewerbe" }),
      { festpreis: 125 }
    );
    const gewerbeSummary = buildTerminPortalSummary(gewerbeLead)!;
    assert.match(gewerbeSummary.priceLabel ?? "", /Festpreis:/);
    assert.match(gewerbeSummary.priceLabel ?? "", /Netto/);
    assert.match(gewerbeSummary.priceLabel ?? "", /Brutto 125/);
  });

  it("termin portal live estimate label when no Festpreis", () => {
    const summary = buildTerminPortalSummary(leadFromQuote(base(), { festpreis: undefined }))!;
    assert.match(summary.priceLabel ?? "", /inkl\. MwSt/);
    assert.doesNotMatch(summary.priceLabel ?? "", /^Festpreis:/);
  });
});

describe("E2E – VAT math + all formatters", () => {
  it("splitBrutto is cent-accurate for many Endpreise", () => {
    for (const brutto of [49, 69, 99, 119, 125, 131, 199.5, 415]) {
      const s = splitBrutto(brutto);
      assert.equal(s.brutto, Math.round(brutto * 100) / 100);
      assert.equal(Math.round((s.netto + s.mwst) * 100), Math.round(s.brutto * 100));
      assert.ok(Math.abs(s.netto * 1.19 - s.brutto) < 0.02);
    }
  });

  it("all Festpreis formatters keep same brutto 125", () => {
    assert.match(formatFestpreisDisplay(125, "privat"), /125\s*€ inkl\. MwSt/);
    assert.match(formatFestpreisDisplay(125, "gewerbe"), /Brutto 125\s*€/);
    assert.match(formatFestpreisEmailLine(125, "privat"), /125\s*€ inkl\. MwSt/);
    assert.match(formatFestpreisEmailLine(125, "gewerbe"), /Brutto 125\s*€/);
    assert.match(formatFestpreisHtmlInner(125, "privat"), /inkl\. MwSt/);
    assert.match(formatFestpreisHtmlInner(125, "gewerbe"), /Brutto \/ Endpreis/);
    const lines = formatFestpreisBreakdownLines(125, "gewerbe");
    assert.ok(lines.some((l) => /Brutto/.test(l) && /125/.test(l)));
    assert.match(formatEstimateAmountLabel(125, "privat"), /inkl\. MwSt/);
    assert.match(formatEstimateRangeLabel(119, 131, "privat"), /inkl\. MwSt/);
    assert.match(formatEstimateRangeLabel(119, 131, "gewerbe"), /Brutto/);
    assert.match(vatFootnote("privat"), /inkl\. MwSt/);
    assert.match(vatFootnote("gewerbe"), new RegExp(VAT_PERCENT_LABEL.replace("%", "\\%")));
  });

  it("VAT display never changes calculator amount", () => {
    const data = base({
      withFrame: true,
      shutters: true,
      flyScreens: true,
      canopy: true,
      canopySqm: 5,
    });
    const a = calculatePriceEstimate(data)!;
    const b = calculatePriceEstimate(data)!;
    assert.equal(a.amount, b.amount);
    assert.equal(a.min, b.min);
    assert.equal(a.max, b.max);
    assert.equal(a.calculatedSubtotal, b.calculatedSubtotal);
    // Labels mention the same min/max numbers
    const label = formatEstimateRangeLabel(a.min, a.max, resolvePriceAudience(data));
    assert.match(label, new RegExp(String(a.min)));
    assert.match(label, new RegExp(String(a.max)));
  });
});

describe("E2E – appointment emails all channels", () => {
  const quote = base();
  const gewerbeQuote = base({ services: ["gewerbe"], objectType: "gewerbe" });

  it("confirmation / reminder / preview – privat inkl, gewerbe Netto", () => {
    const confirm = buildAppointmentConfirmationEmail(
      quote,
      "ANG-E2E",
      "2026-09-01",
      undefined,
      undefined,
      { plannedStartTime: "11:00", estimatedDurationHours: 2 },
      125
    );
    assert.match(confirm.text, /inkl\. MwSt/);
    assert.match(confirm.html, /inkl\. MwSt/);

    const confirmG = buildAppointmentConfirmationEmail(
      gewerbeQuote,
      "ANG-E2E-G",
      "2026-09-01",
      undefined,
      undefined,
      { plannedStartTime: "11:00", estimatedDurationHours: 2 },
      125
    );
    assert.match(confirmG.text, /Netto/);
    assert.match(confirmG.text, /Brutto 125/);
    assert.match(confirmG.html, /Brutto \/ Endpreis/);

    const reminder = buildAppointmentReminderEmail(
      quote,
      "ANG-E2E",
      "2026-09-01",
      undefined,
      { plannedStartTime: "09:30", estimatedDurationHours: 2 },
      125
    );
    assert.match(reminder.text, /inkl\. MwSt/);

    const previewG = getCustomerEmailPreviewDe("confirm", {
      confirmedDate: "2026-09-01",
      festpreis: 125,
      audience: "gewerbe",
      appointment: { plannedStartTime: "11:00", estimatedDurationHours: 2 },
    });
    assert.match(previewG, /Netto|Brutto|zzgl/);
  });
});

describe("E2E – Step3 wizard UX source of truth", () => {
  const step3 = readFileSync(
    join(process.cwd(), "components/quote/steps/Step3Details.tsx"),
    "utf8"
  );

  it("checkbox labels include UX constraints", () => {
    assert.match(step3, /Rollladen \(nur innen\)/);
    assert.match(step3, /Jalousien \(innenliegend\)/);
    assert.match(step3, /Vordach \/ Glasdach \(nur Glas\)/);
    assert.match(step3, /Fliegengitter \(pauschal\)/);
  });

  it("notice blocks exist for shutters, blinds, flyScreens, canopy", () => {
    assert.match(step3, /data-testid="shutters-innen-notice"/);
    assert.match(step3, /data-testid="blinds-innen-notice"/);
    assert.match(step3, /data-testid="flyscreens-notice"/);
    assert.match(step3, /data-testid="canopy-glas-notice"/);
    assert.match(step3, /außenliegende Rollläden sind nicht erreichbar/i);
    assert.match(step3, /Außenjalousien \/ Raffstores nur nach Absprache/);
    assert.match(step3, /Stoffmarkisen \/ textile Vordächer sind nicht enthalten/);
    assert.match(step3, /ausbaubare \/ innen zugängliche/);
  });

  it("wizard renders hints from extraPriceHints keys used in Step3", () => {
    for (const key of [
      "withFrame",
      "withFalz",
      "windowSills",
      "muntinWindows",
      "oldBuildingWindows",
      "skylights",
      "shutters",
      "blinds",
      "canopy",
      "flyScreens",
    ]) {
      assert.ok(extraPriceHints[key], `Step3 key ${key} needs hint`);
    }
  });
});

describe("E2E – wizard card + admin panel wire VAT helpers", () => {
  it("PriceEstimateCard + MobileDock import vat-display", () => {
    const card = readFileSync(
      join(process.cwd(), "components/quote/PriceEstimateCard.tsx"),
      "utf8"
    );
    const dock = readFileSync(
      join(process.cwd(), "components/quote/PriceEstimateMobileDock.tsx"),
      "utf8"
    );
    assert.match(card, /from "@\/lib\/vat-display"/);
    assert.match(card, /inkl\. MwSt/);
    assert.match(card, /splitBrutto/);
    assert.match(dock, /from "@\/lib\/vat-display"/);
    assert.match(dock, /inkl\. MwSt/);
  });

  it("AdminLeadDetailPanel shows Festpreis Netto/Brutto via vat-display", () => {
    const admin = readFileSync(
      join(process.cwd(), "components/admin/AdminLeadDetailPanel.tsx"),
      "utf8"
    );
    assert.match(admin, /from "@\/lib\/vat-display"/);
    assert.match(admin, /splitBrutto/);
    assert.match(admin, /formatFestpreisBreakdownLines/);
    assert.match(admin, /Brutto \/ Endpreis/);
    assert.match(admin, /inkl\. MwSt/);
  });
});
