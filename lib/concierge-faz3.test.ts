import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSession } from "./concierge/types";
import { wizardActionFromSession } from "./concierge/knowledge";
import {
  conciergeQuoteToWizardPrefill,
  hasTransferableQuoteData,
  mergeWizardPrefill,
  suggestWizardStepAfterPrefill,
} from "./concierge/wizard-bridge";
import { initialQuoteFormData } from "./quote-form";
import { getExitIntentMessage, shouldShowExitIntent } from "./concierge/exit-intent";

describe("concierge faz3 – wizard bridge", () => {
  it("detects transferable quote data", () => {
    const empty = createSession("empty");
    assert.equal(hasTransferableQuoteData(empty), false);

    const withFluegel = createSession("fluegel");
    withFluegel.quote.windowCount = 10;
    assert.equal(hasTransferableQuoteData(withFluegel), true);
  });

  it("maps concierge quote to wizard prefill", () => {
    const session = createSession("map");
    session.quote = {
      services: ["privat"],
      windowCount: 12,
      floorLevel: "og2",
      dirtLevel: "stark",
      cleaningSide: "nur_aussen",
      postalCode: "52499",
      city: "Baesweiler",
    };

    const prefill = conciergeQuoteToWizardPrefill(session);
    assert.deepEqual(prefill.services, ["privat"]);
    assert.equal(prefill.windowCount, 12);
    assert.equal(prefill.floorLevel, "og2");
    assert.equal(prefill.objectType, "wohnung");
    assert.equal(prefill.elevator, "unbekannt");
    assert.equal(prefill.dirtLevel, "stark");
    assert.equal(prefill.cleaningSide, "nur_aussen");
    assert.equal(prefill.postalCode, "52499");
    assert.equal(prefill.city, "Baesweiler");
  });

  it("merges prefill and suggests step 3 when price fields complete", () => {
    const session = createSession("step");
    session.quote = {
      services: ["privat"],
      windowCount: 8,
      floorLevel: "eg",
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
    };

    const merged = mergeWizardPrefill(initialQuoteFormData, conciergeQuoteToWizardPrefill(session));
    assert.equal(suggestWizardStepAfterPrefill(merged), 3);
    assert.equal(merged.windowCount, 8);
    assert.equal(merged.objectType, "wohnung");
  });

  it("suggests step 2 when floor missing", () => {
    const merged = mergeWizardPrefill(initialQuoteFormData, {
      services: ["privat"],
      windowCount: 6,
      objectType: "wohnung",
      elevator: "unbekannt",
    });
    assert.equal(suggestWizardStepAfterPrefill(merged), 2);
  });

  it("changes wizard CTA when session has data", () => {
    const session = createSession("cta");
    assert.match(wizardActionFromSession(session).label, /berechnen/i);

    session.quote.windowCount = 5;
    session.quote.floorLevel = "og1";
    assert.match(wizardActionFromSession(session).label, /übernehmen/i);
  });
});

describe("concierge faz3 – exit intent", () => {
  it("allows exit intent on home and angebot", () => {
    assert.equal(shouldShowExitIntent("/de"), true);
    assert.equal(shouldShowExitIntent("/de/angebot"), true);
    assert.equal(shouldShowExitIntent("/de/impressum"), false);
  });

  it("returns page-specific exit messages", () => {
    const session = createSession("exit");
    session.quote.windowCount = 10;
    session.quote.floorLevel = "og2";

    assert.match(getExitIntentMessage("/de/angebot"), /Kalkulation|Flügel/i);
    assert.match(getExitIntentMessage("/de", session), /übernehmen/i);
    assert.match(getExitIntentMessage("/de"), /Live-Preisschätzung/i);
  });
});
