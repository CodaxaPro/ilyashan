/**
 * Corporate proof: every Ilyashan service has a sales path — no silent gaps.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "@/lib/concierge/types";
import { isHotLead } from "@/lib/concierge/lead";
import { validateLeadContact } from "@/lib/concierge/lead";
import { applyBueroStructuredFields } from "../dialog/buero";
import { applyFensterStructuredFields } from "../dialog/fenster";
import { applyTreppenhausStructuredFields } from "../dialog/treppenhaus";
import { buildSystemKnowledgeOverview } from "../knowledge/system-card";
import { resolveProduct } from "../resolve-product";
import { isAllowlistedTool } from "../tools/registry";
import { ALL_SALES_PRODUCTS, openServiceCase, productLabel } from "./catalog";

const SAMPLE_ASK: Record<(typeof ALL_SALES_PRODUCTS)[number], string> = {
  fenster: "Was kostet Fensterreinigung?",
  buero: "Büroreinigung Preis?",
  treppenhaus: "Treppenhausreinigung Kosten",
  praxis: "Praxisreinigung Anfrage",
  bauend: "Bauendreinigung Angebot",
  renovierung: "Renovierungsreinigung",
  entruempelung: "Entrümpelung Wohnung",
  gutschein: "Gutschein Fenster",
};

describe("sales catalog — every product resolves", () => {
  for (const product of ALL_SALES_PRODUCTS) {
    it(`resolve_product → ${product}`, () => {
      const r = resolveProduct(SAMPLE_ASK[product]);
      assert.equal(r.ok, true);
      if (r.ok) assert.equal(r.data.product, product);
    });
  }
});

describe("sales catalog — open_service_case never dead-ends", () => {
  for (const product of ALL_SALES_PRODUCTS) {
    it(`open_service_case(${product}) asks next step`, () => {
      const r = openServiceCase(createSession(`c-${product}`), product);
      assert.equal(r.session.assistantProduct, product);
      assert.ok(r.text.length > 40, "sales text too thin");
      assert.doesNotMatch(r.text, /leider kann ich|nicht möglich|Feature fehlt/i);
      assert.ok(r.actions.length >= 1);
      assert.ok(r.quickReplies.length >= 1);
      assert.match(productLabel(product), /./);
    });
  }

  it("manual Festpreis products open hot-lead path", () => {
    for (const product of ["praxis", "bauend", "renovierung", "entruempelung"] as const) {
      const r = openServiceCase(createSession(`hot-${product}`), product);
      assert.equal(r.session.stage, "price_ready");
      assert.equal(isHotLead(r.session), true);
      assert.match(r.text, /Festpreis|Telefon|Name/i);
    }
  });
});

describe("sales catalog — live engines close with euro + hot lead", () => {
  it("fenster", () => {
    const r = applyFensterStructuredFields(createSession("sf"), {
      windowCount: 10,
      floorLevel: "og1",
    });
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.equal(isHotLead(r.session), true);
  });

  it("treppenhaus", () => {
    const r = applyTreppenhausStructuredFields(createSession("st"), {
      stockwerke: 3,
      wohnungen: 6,
      stairTurnus: "biweekly",
      dirtLevel: "normal",
      keller: false,
    });
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.equal(isHotLead(r.session), true);
  });

  it("buero", () => {
    const r = applyBueroStructuredFields(createSession("sb"), {
      totalAreaM2: 150,
      frequency: "2_PER_WEEK",
      workstations: 8,
    });
    assert.equal(r.complete, true);
    assert.equal(r.emittedEuro, true);
    assert.equal(isHotLead(r.session), true);
    assert.match(r.text, /€/);
  });
});

describe("sales catalog — system + tools ready for full close", () => {
  it("system knowledge lists chat-capable products", () => {
    const o = buildSystemKnowledgeOverview();
    const products = o.products as { id: string }[];
    for (const id of ALL_SALES_PRODUCTS) {
      assert.ok(products.some((p) => p.id === id), `missing ${id} in system card`);
    }
  });

  it("sales tools allowlisted", () => {
    for (const tool of [
      "open_service_case",
      "upsert_fenster_fields",
      "upsert_buero_fields",
      "upsert_treppenhaus_fields",
      "submit_customer_lead",
      "get_available_slots",
      "get_system_knowledge",
    ]) {
      assert.equal(isAllowlistedTool(tool), true, tool);
    }
  });

  it("lead contact validation blocks empty close", () => {
    assert.ok(validateLeadContact("", "0173"));
    assert.ok(validateLeadContact("Max", "123"));
    assert.equal(validateLeadContact("Max Mustermann", "01733828354"), null);
  });
});
