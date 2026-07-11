/**
 * Cross-layer sync: wizard engine output must match email rows, PDF rows, and stored snapshot.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePriceEstimate } from "./pricing";
import {
  buildQuoteTableRowsFromContext,
  getPriceLabelFromContext,
} from "./quote-summary";
import {
  captureQuotePriceSnapshot,
  createQuotePricingContext,
  getBillingSubtotal,
} from "./quote-pricing-context";
import { buildQuoteAdminEmail, buildQuoteCustomerEmail } from "./quote-email";
import { DEFAULT_FENSTER_PRICING } from "./pricing-config";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";
import { siteConfig } from "./config";
import { compareWartungPackages } from "./wartung-pricing";

const ctx = createQuotePricingContext(DEFAULT_FENSTER_PRICING);

function sampleQuote(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "wohnung",
    floorLevel: "og2",
    elevator: "nein",
    windowCount: 16,
    dirtLevel: "stark",
    cleaningSide: "nur_aussen",
    roomHeight: 3.5,
    withFrame: true,
    narrowStairs: true,
    firstName: "Max",
    lastName: "Mustermann",
    phone: "02401 123456",
    email: "max@example.com",
    postalCode: "52499",
    city: "Baesweiler",
    privacyAccepted: true,
    ...overrides,
  };
}

describe("Quote sync – wizard ≡ email ≡ PDF ≡ snapshot", () => {
  it("getPriceLabel matches calculatePriceEstimate range", () => {
    const data = sampleQuote();
    const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig)!;
    const label = getPriceLabelFromContext(data, ctx);
    assert.match(label, /ca\./);
    assert.match(label, new RegExp(String(estimate.min)));
    assert.match(label, new RegExp(String(estimate.max)));
  });

  it("email admin/customer price row equals table row", () => {
    const data = sampleQuote();
    const anfrageNr = "ANG-2026-123456";
    const tableRows = buildQuoteTableRowsFromContext(data, anfrageNr, ctx);
    const tablePrice = tableRows.find(([k]) => k === siteConfig.messaging.priceEstimateRowLabel)?.[1];

    const admin = buildQuoteAdminEmail(data, anfrageNr, 0, ctx);
    assert.ok(admin.text.includes(tablePrice!));

    const customer = buildQuoteCustomerEmail(data, anfrageNr, ctx);
    assert.ok(customer.text.includes(tablePrice!));
    assert.ok(customer.html.includes(tablePrice!));
  });

  it("snapshot preserves submission price for admin replay", () => {
    const data = sampleQuote({ services: ["privat", "wartung"], wartungPackageId: "quarterly" });
    const snapshot = captureQuotePriceSnapshot(data, ctx)!;
    const replayLabel = getPriceLabelFromContext(data, {
      pricingOverrides: snapshot.pricing,
      wartungConfig: snapshot.wartungConfig,
      wartungPackages: snapshot.wartungPackages,
    });
    assert.equal(replayLabel, snapshot.priceLabel);
  });

  it("admin override flows through all output layers", () => {
    const data = sampleQuote({
      windowCount: 20,
      floorLevel: "eg",
      elevator: "ja",
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
      roomHeight: 2.5,
      withFrame: false,
      narrowStairs: false,
    });
    const overrideCtx = createQuotePricingContext({
      ...DEFAULT_FENSTER_PRICING,
      basePerFluegel: 7.5,
    });
    const anfrageNr = "ANG-2026-999999";
    const estimate = calculatePriceEstimate(data, overrideCtx.pricingOverrides, overrideCtx.wartungConfig)!;
    const label = getPriceLabelFromContext(data, overrideCtx);
    const rows = buildQuoteTableRowsFromContext(data, anfrageNr, overrideCtx);
    const rowPrice = rows.find(([k]) => k === siteConfig.messaging.priceEstimateRowLabel)?.[1];
    assert.equal(rowPrice, label);
    assert.equal(estimate.calculatedSubtotal, 20 * 7.5);
  });

  it("wartung selector uses billing subtotal not rounded display amount", () => {
    const data = sampleQuote({ windowCount: 4, objectType: "wohnung", withFrame: false, narrowStairs: false });
    const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig)!;
    assert.ok(estimate.minimumApplied);
    assert.notEqual(estimate.amount, getBillingSubtotal(estimate));
    const comparisons = compareWartungPackages(getBillingSubtotal(estimate), ctx.wartungPackages, "privat");
    const full = calculatePriceEstimate(
      { ...data, services: ["privat", "wartung"], wartungPackageId: "quarterly" },
      ctx.pricingOverrides,
      ctx.wartungConfig
    )!;
    assert.equal(full.wartung!.monthlyPrice, comparisons.find((c) => c.packageId === "quarterly")!.monthlyPrice);
  });
});
