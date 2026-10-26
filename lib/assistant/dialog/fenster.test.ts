import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "@/lib/concierge/types";
import { isHotLead } from "@/lib/concierge/lead";
import { applyFensterStructuredFields, advanceFensterDialog } from "./fenster";

describe("assistant/fenster dialog — engine quote + hot lead", () => {
  it("asks for missing floor then completes with euro", () => {
    let r = applyFensterStructuredFields(createSession("f1"), { windowCount: 12 });
    assert.equal(r.complete, false);
    assert.equal(r.emittedEuro, false);
    assert.match(r.text, /Stockwerk|Etage/i);

    r = applyFensterStructuredFields(r.session, { floorLevel: "eg" });
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.equal(r.session.stage, "price_ready");
    assert.equal(isHotLead(r.session), true);
    assert.match(r.text, /€|Euro|Orientierung|Festpreis/i);
  });

  it("accepts bare '1' as 1. OG after Flügel is known", () => {
    let r = applyFensterStructuredFields(createSession("f2"), { windowCount: 12 });
    r = advanceFensterDialog(r.session, "1");
    assert.equal(r.session.quote.floorLevel, "og1");
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
  });
});
