/**
 * Corporate proof suite — assistant Phase A.
 * Failures here must block enabling ASSISTANT_TOOLS_ENABLED on production.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateTreppenhausQuote } from "@/lib/treppenhaus/pricing";
import { createInitialCustomerInput } from "@/lib/cleaning/types";
import { calculateOfficeCleaningQuote } from "@/lib/cleaning/calculate";
import { calculatePriceEstimate } from "@/lib/pricing";
import { initialQuoteFormData } from "@/lib/quote-form";
import { defaultQuotePricingContext } from "@/lib/quote-pricing-context";
import { quoteDataForEstimate } from "@/lib/concierge/pricing-response";
import { processConciergeMessage, createSession } from "@/lib/concierge";
import { routes } from "@/lib/routes";
import {
  isAssistantToolsEnabled,
  mayEmitEuroAmount,
  priceDisclosureFor,
  resolveProduct,
  buildAssistantPriceReply,
  priceFenster,
  priceTreppenhaus,
  priceBuero,
  priceManualService,
  ORIENTIERUNG_DISCLAIMER_DE,
  MANUAL_PRICE_DISCLAIMER_DE,
} from "./index";

describe("assistant/feature flag — live safety", () => {
  it("defaults to disabled when env unset", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    delete process.env.ASSISTANT_TOOLS_ENABLED;
    assert.equal(isAssistantToolsEnabled(), false);
    if (prev !== undefined) process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });

  it("enables only on explicit true/1/yes", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    assert.equal(isAssistantToolsEnabled(), true);
    process.env.ASSISTANT_TOOLS_ENABLED = "false";
    assert.equal(isAssistantToolsEnabled(), false);
    if (prev === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });
});

describe("assistant/policy — never invent prices", () => {
  it("only fenster may emit euro from free-text chat policy", () => {
    assert.equal(mayEmitEuroAmount("fenster"), true);
    assert.equal(mayEmitEuroAmount("buero"), false);
    assert.equal(mayEmitEuroAmount("treppenhaus"), false);
    assert.equal(mayEmitEuroAmount("praxis"), false);
    assert.equal(mayEmitEuroAmount("bauend"), false);
  });

  it("manual services are manual_festpreis_only", () => {
    assert.equal(priceDisclosureFor("praxis"), "manual_festpreis_only");
    assert.equal(priceDisclosureFor("entruempelung"), "manual_festpreis_only");
  });

  it("büro/treppenhaus require calculator for chat disclosure", () => {
    assert.equal(priceDisclosureFor("buero"), "calculator_required");
    assert.equal(priceDisclosureFor("treppenhaus"), "calculator_required");
  });
});

describe("assistant/resolve_product", () => {
  it("detects treppenhaus with high confidence", () => {
    const r = resolveProduct("Was kostet Treppenhausreinigung in Baesweiler?");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.data.product, "treppenhaus");
    assert.equal(r.data.calculatorHref, routes.treppenhausreinigungAngebot);
  });

  it("detects büro", () => {
    const r = resolveProduct("Büroreinigung Preis für 200 qm");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.data.product, "buero");
  });

  it("detects fenster", () => {
    const r = resolveProduct("10 Flügel Fensterreinigung 2. OG");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.data.product, "fenster");
  });

  it("detects praxis without inventing a calculator orientation", () => {
    const r = resolveProduct("Was kostet Praxisreinigung?");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.data.product, "praxis");
    assert.equal(r.data.disclosure, "manual_festpreis_only");
  });
});

describe("assistant/price tools — engine parity", () => {
  it("fenster tool matches calculatePriceEstimate cents", () => {
    const partial = {
      ...initialQuoteFormData,
      services: ["privat" as const],
      windowCount: 10,
      floorLevel: "og2" as const,
      cleaningSide: "innen_aussen" as const,
      dirtLevel: "normal" as const,
    };
    const ctx = defaultQuotePricingContext();
    const normalized = quoteDataForEstimate(partial);
    assert.ok(normalized);
    const estimate = calculatePriceEstimate(
      normalized!,
      ctx.pricingOverrides,
      ctx.wartungConfig
    );
    assert.ok(estimate);
    const tool = priceFenster(partial, ctx);
    assert.equal(tool.ok, true);
    if (!tool.ok) return;
    assert.equal(tool.data.monthlyOrTotalGrossCents, Math.round(estimate!.amount * 100));
    assert.match(tool.data.labelDe, /Live-Preisschätzung|Orientierung|ca\./i);
    assert.ok(ORIENTIERUNG_DISCLAIMER_DE.length > 20);
  });

  it("fenster tool refuses incomplete inputs (no fake euro)", () => {
    const tool = priceFenster({ windowCount: 0 });
    assert.equal(tool.ok, false);
    if (tool.ok) return;
    assert.equal(tool.code, "missing_inputs");
    assert.equal(tool.calculatorHref, routes.angebot);
  });

  it("treppenhaus structured input matches calculateTreppenhausQuote", () => {
    const input = {
      stockwerke: 4,
      wohnungen: 8,
      stairTurnus: "biweekly" as const,
      dirtLevel: "normal" as const,
      keller: true,
      kellerTurnus: "monthly" as const,
      aufzug: false,
      glasHandlauf: false,
    };
    const engine = calculateTreppenhausQuote(input);
    const tool = priceTreppenhaus(input);
    assert.equal(tool.ok, true);
    if (!tool.ok) return;
    assert.equal(tool.data.monthlyOrTotalGrossCents, engine.monthlyGrossCents);
    assert.equal(tool.data.monthlyOrTotalNetCents, engine.monthlyNetCents);
  });

  it("treppenhaus chat (null input) never emits euro — calculator required", () => {
    const tool = priceTreppenhaus(null);
    assert.equal(tool.ok, false);
    if (tool.ok) return;
    assert.equal(tool.code, "calculator_required");
    assert.equal(tool.calculatorHref, routes.treppenhausreinigungAngebot);
    assert.doesNotMatch(tool.messageDe, /\d+[.,]\d+\s*€/);
  });

  it("büro structured input matches cleaning engine gross cents", () => {
    const input = createInitialCustomerInput({
      language: "de",
      frequency: "1_PER_WEEK",
      totalAreaM2: 200,
    });
    const engine = calculateOfficeCleaningQuote(input);
    const tool = priceBuero(input);
    assert.equal(tool.ok, true);
    if (!tool.ok) return;
    assert.equal(tool.data.monthlyOrTotalGrossCents, engine.customer.grossCents);
  });

  it("büro chat (null) never emits euro", () => {
    const tool = priceBuero(null);
    assert.equal(tool.ok, false);
    if (tool.ok) return;
    assert.equal(tool.code, "calculator_required");
    assert.doesNotMatch(tool.messageDe, /\d+[.,]\d+\s*€/);
  });

  it("manual services never emit euro and keep Anfrage path", () => {
    for (const product of ["praxis", "bauend", "renovierung", "entruempelung"] as const) {
      const tool = priceManualService(product);
      assert.equal(tool.ok, false);
      if (tool.ok) continue;
      assert.equal(tool.code, "no_online_price");
      assert.equal(tool.messageDe, MANUAL_PRICE_DISCLAIMER_DE);
      assert.ok(tool.calculatorHref);
      assert.doesNotMatch(tool.messageDe, /€|\d+\s*Euro/i);
    }
  });
});

describe("assistant/customer reply — no silent euro for non-fenster", () => {
  it("treppenhaus price question → calculator CTA, emittedEuro false", () => {
    const reply = buildAssistantPriceReply("Was kostet Treppenhausreinigung?");
    assert.equal(reply.product, "treppenhaus");
    assert.equal(reply.emittedEuro, false);
    assert.ok(reply.actions.some((a) => a.href.includes("treppenhausreinigung/angebot")));
    assert.doesNotMatch(reply.text, /\d+[.,]\d+\s*€/);
  });

  it("praxis price question → manual disclaimer, no euro", () => {
    const reply = buildAssistantPriceReply("Was kostet Praxisreinigung?");
    assert.equal(reply.product, "praxis");
    assert.equal(reply.emittedEuro, false);
    assert.match(reply.text, /kein Online-Preis|Festpreis nach Prüfung/i);
  });

  it("Preisliste / fiyat listesi → overview with calculator CTAs, no refusal", () => {
    const reply = buildAssistantPriceReply("merhaba fiyat listeniz nerede");
    assert.equal(reply.emittedEuro, false);
    assert.doesNotMatch(reply.text, /kann keine Preis|keine Preisliste bereitstellen/i);
    assert.match(reply.text, /keine feste PDF-Preisliste|objektbezogen|Preisrechner/i);
    assert.ok(reply.actions.some((a) => a.href.includes("/angebot")));
    assert.ok(reply.actions.some((a) => a.href.includes("treppenhausreinigung/angebot")));
  });
});

describe("assistant/live concierge regression — flag off unchanged", () => {
  it("with flag off, fenster greeting still works via classic path", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    delete process.env.ASSISTANT_TOOLS_ENABLED;
    const reply = processConciergeMessage("Hallo", createSession("t1"));
    assert.equal(reply.intent, "greeting");
    assert.ok(reply.text.length > 10);
    if (prev !== undefined) process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });

  it("with flag off, treppenhaus price question does not crash", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    delete process.env.ASSISTANT_TOOLS_ENABLED;
    const reply = processConciergeMessage(
      "Was kostet Treppenhausreinigung?",
      createSession("t2")
    );
    assert.ok(reply.text.length > 5);
    if (prev !== undefined) process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });
});

describe("assistant/concierge wire — flag on multi-product", () => {
  it("sync concierge with tools flag still safe for treppenhaus (async dialog is primary)", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    const reply = processConciergeMessage(
      "Was kostet Treppenhausreinigung?",
      createSession("t3")
    );
    assert.ok(reply.text.length > 5);
    assert.doesNotMatch(reply.text, /999\s*€/);
    if (prev === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });

  it("does not invent praxis euro when flag on", () => {
    const prev = process.env.ASSISTANT_TOOLS_ENABLED;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    const reply = processConciergeMessage(
      "Was kostet Praxisreinigung?",
      createSession("t4")
    );
    assert.equal(reply.intent, "price");
    assert.doesNotMatch(reply.text, /\d+\s*€/);
    assert.match(reply.text, /Festpreis|Online-Preis/i);
    if (prev === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prev;
  });
});
