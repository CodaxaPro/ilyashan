import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TREPPENHAUS_PRICING } from "@/lib/treppenhaus/pricing";
import { siteConfig } from "@/lib/config";
import {
  buildSystemKnowledgeDetail,
  buildSystemKnowledgeOverview,
  formatSystemKnowledgeForPrompt,
} from "./system-card";

describe("assistant system knowledge — reads live config/engines", () => {
  it("overview includes company phone and no-invent rule", () => {
    const o = buildSystemKnowledgeOverview();
    assert.equal(o.phone, siteConfig.contact.phoneDisplay);
    assert.equal((o.pricingRules as { neverInventEuro: boolean }).neverInventEuro, true);
    assert.ok(Array.isArray(o.products));
  });

  it("treppenhaus topic exposes real engine constants", () => {
    const d = buildSystemKnowledgeDetail("treppenhaus");
    const cfg = d.engineConfig as { baseVisitEuro: number; weeklyPackageFactor: number };
    assert.equal(cfg.baseVisitEuro, TREPPENHAUS_PRICING.baseVisitEuro);
    assert.equal(cfg.weeklyPackageFactor, TREPPENHAUS_PRICING.weeklyPackageFactor);
    assert.equal(d.engine, "calculateTreppenhausQuote");
  });

  it("prompt block is non-empty JSON knowledge", () => {
    const text = formatSystemKnowledgeForPrompt();
    assert.match(text, /SYSTEMWISSEN/);
    assert.match(text, /neverInventEuro/);
    assert.match(text, /get_system_knowledge/);
  });
});
