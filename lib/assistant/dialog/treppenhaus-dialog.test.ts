import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "@/lib/concierge/types";
import { calculateTreppenhausQuote, formatEuroFromCents } from "@/lib/treppenhaus/pricing";
import { processConciergeMessageAsync } from "../process";
import {
  advanceTreppenhausDialog,
  applyTreppenhausStructuredFields,
  extractTreppenhausPatch,
  formatTreppenhausQuoteText,
  getTreppenhausSystemCard,
  isTreppenhausComplete,
} from "./treppenhaus";

describe("assistant/treppenhaus dialog — human Q&A + engine", () => {
  it("extracts stockwerke and turnus from natural language", () => {
    const p = extractTreppenhausPatch("4 Stockwerke, alle 14 Tage");
    assert.equal(p.stockwerke, 4);
    assert.equal(p.stairTurnus, "biweekly");
  });

  it("asks for stockwerke first, then completes and emits engine euro", () => {
    let r = advanceTreppenhausDialog(createSession("d1"), "Was kostet Treppenhausreinigung?");
    assert.equal(r.complete, false);
    assert.equal(r.emittedEuro, false);
    assert.match(r.text, /Stockwerke/i);

    r = advanceTreppenhausDialog(r.session, "3");
    assert.equal(r.session.treppenhausDraft?.stockwerke, 3);
    assert.match(r.text, /Wohnungen/i);

    r = advanceTreppenhausDialog(r.session, "6 Wohnungen");
    assert.match(r.text, /Turnus/i);

    r = advanceTreppenhausDialog(r.session, "Alle 14 Tage");
    assert.match(r.text, /Verschmutzung/i);

    r = advanceTreppenhausDialog(r.session, "Normal");
    assert.match(r.text, /Keller/i);

    r = advanceTreppenhausDialog(r.session, "Nein, ohne Keller");
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.match(r.text, /brutto|Orientierung/i);

    const draft = r.session.treppenhausDraft!;
    assert.ok(isTreppenhausComplete(draft));
    const engine = calculateTreppenhausQuote(draft);
    assert.match(
      formatTreppenhausQuoteText(draft),
      new RegExp(formatEuroFromCents(engine.monthlyGrossCents).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  });

  it("accepts multi-field answer in one message", () => {
    let r = advanceTreppenhausDialog(createSession("d3"), "Treppenhaus Preis");
    r = advanceTreppenhausDialog(
      r.session,
      "3 Stockwerke, 8 Wohnungen, alle 14 Tage, normal, ohne Keller"
    );
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.equal(r.session.treppenhausDraft?.stockwerke, 3);
    assert.equal(r.session.treppenhausDraft?.wohnungen, 8);
  });

  it("AI structured upsert maps NL intent without regex teaching", () => {
    let r = applyTreppenhausStructuredFields(createSession("ai1"), {});
    assert.equal(r.complete, false);
    r = applyTreppenhausStructuredFields(r.session, {
      stockwerke: 4,
      wohnungen: 6,
      stairTurnus: "weekly",
      dirtLevel: "heavy",
      keller: false,
    });
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.match(r.text, /610,14/);

    r = applyTreppenhausStructuredFields(r.session, { confirmQuote: true });
    assert.match(r.text, /Preismotor|610,14/i);
  });

  it("system card exposes missing fields for the model", () => {
    const card = getTreppenhausSystemCard(createSession("card"));
    assert.equal(card.engine, "calculateTreppenhausQuote");
    assert.ok(card.missing.includes("stockwerke"));
  });

  it("exits dialog when customer switches to another service", () => {
    let r = advanceTreppenhausDialog(createSession("d4"), "Treppenhaus");
    assert.equal(r.session.assistantProduct, "treppenhaus");
    r = advanceTreppenhausDialog(r.session, "doch lieber Fensterreinigung");
    assert.equal(r.exited, true);
    assert.equal(r.session.assistantProduct, undefined);
    assert.match(r.text, /Fenster|Büro/i);
  });

  it("recalculates when customer changes stockwerke", () => {
    const steps = [
      "Treppenhaus Preis",
      "4",
      "8 Wohnungen",
      "Monatlich",
      "Normal",
      "ohne Keller",
    ];
    let r = advanceTreppenhausDialog(createSession("d2"), steps[0]!);
    for (let i = 1; i < steps.length; i++) {
      r = advanceTreppenhausDialog(r.session, steps[i]!);
    }
    assert.equal(r.complete, true);
    const firstGross = calculateTreppenhausQuote(r.session.treppenhausDraft!).monthlyGrossCents;

    r = advanceTreppenhausDialog(r.session, "5 Stockwerke");
    assert.equal(r.complete, true);
    assert.equal(r.session.treppenhausDraft?.stockwerke, 5);
    const secondGross = calculateTreppenhausQuote(r.session.treppenhausDraft!).monthlyGrossCents;
    assert.notEqual(firstGross, secondGross);
    assert.match(r.text, /5 Stockwerke/);
  });
});

describe("assistant/process — tools on uses treppenhaus dialog", () => {
  it("routes treppenhaus price into live dialog without invented refusal", async () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    process.env.ASSISTANT_AI_ENABLED = "false";

    const { reply, meta } = await processConciergeMessageAsync(
      "Was kostet Treppenhausreinigung?",
      createSession("p1")
    );
    assert.equal(meta.fallbackReason, "treppenhaus_collect");
    assert.match(reply.text, /Stockwerke/i);
    assert.doesNotMatch(reply.text, /keine Preisliste bereitstellen/i);

    if (prev === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });
});
