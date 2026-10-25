/**
 * NRW / DE market-mid calibration for Treppenhausreinigung.
 * Sources (2024–2026 public bands):
 * - PremiumFix NRW HV: mid MFH 140–220 €/Monat wöchentlich-equivalent biweekly lower
 * - Knop / Blink: 80–400 €/Monat; 5–20 €/WE; 14-täglich ≈ −40–50 %
 * - Ilyashan legacy invoices Hoengen: 45→55 €/Einsatz, typically 2×/Monat
 *
 * Online orientation must sit in corporate mid — above legacy floor, inside public bands.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateTreppenhausQuote, type TreppenhausInput } from "./pricing";

function quote(partial: Partial<TreppenhausInput>) {
  return calculateTreppenhausQuote({
    stockwerke: 3,
    wohnungen: 6,
    stairTurnus: "biweekly",
    dirtLevel: "normal",
    keller: false,
    kellerTurnus: "biweekly",
    aufzug: false,
    glasHandlauf: false,
    ...partial,
  });
}

/** Netto €/Monat acceptable band for orientation (not Festpreis). */
const BIWEEKLY_BANDS: Array<{
  label: string;
  stockwerke: number;
  wohnungen: number;
  min: number;
  max: number;
}> = [
  { label: "klein 2/4", stockwerke: 2, wohnungen: 4, min: 150, max: 280 },
  { label: "mittel 3/6", stockwerke: 3, wohnungen: 6, min: 180, max: 320 },
  { label: "mittel+ 4/8", stockwerke: 4, wohnungen: 8, min: 200, max: 360 },
  { label: "groß 5/12", stockwerke: 5, wohnungen: 12, min: 240, max: 420 },
];

describe("treppenhaus/NRW market-mid calibration", () => {
  for (const band of BIWEEKLY_BANDS) {
    it(`${band.label} biweekly netto inside [${band.min},${band.max}] €`, () => {
      const net =
        quote({
          stockwerke: band.stockwerke,
          wohnungen: band.wohnungen,
          stairTurnus: "biweekly",
        }).monthlyNetCents / 100;
      assert.ok(
        net >= band.min && net <= band.max,
        `${band.label}: ${net}€ outside [${band.min},${band.max}]`
      );
    });
  }

  it("€/Wohnung/Monat biweekly mid objects stay in 15–40 € (umlagefähig band)", () => {
    for (const we of [6, 8, 10, 12]) {
      const floors = we <= 6 ? 3 : we <= 10 ? 4 : 5;
      const net = quote({ stockwerke: floors, wohnungen: we, stairTurnus: "biweekly" }).monthlyNetCents / 100;
      const perWe = net / we;
      assert.ok(perWe >= 15 && perWe <= 45, `${floors}/${we}: ${perWe.toFixed(1)} €/WE`);
    }
  });

  it("weekly is ~1.7× biweekly (4×0.85 / 2), not a full 2× overcharge", () => {
    const bi = quote({ stairTurnus: "biweekly" }).monthlyNetCents;
    const wk = quote({ stairTurnus: "weekly" }).monthlyNetCents;
    const ratio = wk / bi;
    assert.ok(ratio > 1.6 && ratio < 1.8, `weekly/biweekly ratio ${ratio}`);
  });

  it("14-täglich saves ~40–50% vs weekly for same object", () => {
    const bi = quote({ stairTurnus: "biweekly" }).monthlyNetCents;
    const wk = quote({ stairTurnus: "weekly" }).monthlyNetCents;
    const saving = 1 - bi / wk;
    assert.ok(saving >= 0.38 && saving <= 0.5, `saving ${saving}`);
  });

  it("beats legacy Hoengen floor (55€×2=110) by ≥80% on mid objects", () => {
    const mid = quote({ stockwerke: 3, wohnungen: 6, stairTurnus: "biweekly" }).monthlyNetCents / 100;
    assert.ok(mid >= 110 * 1.8, `mid ${mid} must beat legacy 110 by ≥80%`);
  });

  it("Keller monthly under weekly stair stays cheaper than weekly Keller", () => {
    const kWeekly = quote({
      stairTurnus: "weekly",
      keller: true,
      kellerTurnus: "weekly",
    }).monthlyNetCents;
    const kMonthly = quote({
      stairTurnus: "weekly",
      keller: true,
      kellerTurnus: "monthly",
    }).monthlyNetCents;
    assert.ok(kMonthly < kWeekly);
  });
});
