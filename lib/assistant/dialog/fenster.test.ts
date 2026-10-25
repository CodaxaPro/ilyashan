import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "@/lib/concierge/types";
import { isHotLead } from "@/lib/concierge/lead";
import { applyFensterStructuredFields } from "./fenster";

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
});
