import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createTreppenhausStoredLead } from "./lead-bridge";
import { buildTreppenhausSnapshot } from "./snapshot";
import { isCompleteQuoteLead, isTreppenhausLead, getLeadServiceLine } from "../lead-product";

const root = join(import.meta.dirname, "../..");

describe("treppenhaus/submit flow proof", () => {
  it("API route file exists", () => {
    assert.ok(existsSync(join(root, "app/api/treppenhaus/quote/route.ts")));
  });

  it("builds lead with server-recalculated snapshot (not client trust)", () => {
    const snap = buildTreppenhausSnapshot(
      {
        stockwerke: 4,
        wohnungen: 8,
        stairTurnus: "biweekly",
        dirtLevel: "normal",
        keller: true,
        kellerTurnus: "monthly",
        aufzug: false,
        glasHandlauf: false,
      },
      {
        name: "Test Hausverwaltung",
        email: "test@example.com",
        phone: "01730000000",
        postalCode: "52499",
        city: "Baesweiler",
        privacyAccepted: true,
      },
      "TRP-TEST-001"
    );

    assert.equal(snap.quote.monthlyNetCents, 24400 + 1200); // 244 stair + 12 keller
    assert.match(snap.quoteReference, /^TRP-/);

    const lead = createTreppenhausStoredLead(snap);
    assert.equal(lead.serviceLine, "treppenhaus");
    assert.equal(lead.source, "quote");
    assert.equal(lead.anfrageNr, "TRP-TEST-001");
    assert.ok(lead.summary.includes("Treppenhausreinigung"));
    assert.ok(lead.summary.includes("Keller: ja"));
    assert.ok(isTreppenhausLead(lead));
    assert.equal(getLeadServiceLine(lead), "treppenhaus");
    assert.equal(isCompleteQuoteLead(lead), true);
  });

  it("calculator UI posts to treppenhaus quote API", () => {
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const ui = readFileSync(join(root, "components/treppenhaus/TreppenhausCalculator.tsx"), "utf8");
    assert.match(ui, /\/api\/treppenhaus\/quote/);
    assert.match(ui, /trackRequestQuoteConversion/);
    assert.match(ui, /Kalkulation verbindlich anfragen/);
    assert.doesNotMatch(ui, /#anfrage/);
  });
});
