/**
 * Corporate AI+API proofs — mock provider only (no network).
 * Production AI stays off until ASSISTANT_AI_ENABLED + OPENAI_API_KEY + ops sign-off.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "@/lib/concierge/types";
import {
  canRunAssistantAi,
  isAssistantAiEnabled,
  isAssistantToolsEnabled,
} from "../feature-flag";
import { processConciergeMessageAsync } from "../process";
import { enforceNoInventedPrice, textContainsPriceClaim } from "./guards";
import { MockAiProvider } from "./mock-provider";
import { runAssistantAi } from "./run";
import { isAllowlistedTool } from "../tools/registry";

describe("assistant/ai flags — fail closed", () => {
  it("AI cannot enable without tools", () => {
    const prevT = process.env.ASSISTANT_TOOLS_ENABLED;
    const prevA = process.env.ASSISTANT_AI_ENABLED;
    delete process.env.ASSISTANT_TOOLS_ENABLED;
    process.env.ASSISTANT_AI_ENABLED = "true";
    assert.equal(isAssistantToolsEnabled(), false);
    assert.equal(isAssistantAiEnabled(), false);
    assert.equal(canRunAssistantAi(), false);
    if (prevT === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prevT;
    if (prevA === undefined) delete process.env.ASSISTANT_AI_ENABLED;
    else process.env.ASSISTANT_AI_ENABLED = prevA;
  });
});

describe("assistant/ai guards — no invented euro", () => {
  it("detects euro claims", () => {
    assert.equal(textContainsPriceClaim("Das kostet 120,00 €"), true);
    assert.equal(textContainsPriceClaim("ca. 99 Euro"), true);
    assert.equal(textContainsPriceClaim("Bitte Preisrechner nutzen"), false);
  });

  it("blocks invented price when tool did not authorize euro", () => {
    const r = enforceNoInventedPrice("Treppenhaus kostet 55 €", false);
    assert.equal(r.blockedInventedPrice, true);
    assert.doesNotMatch(r.text, /55/);
  });

  it("allows tool-authorized text with euro", () => {
    const r = enforceNoInventedPrice("Orientierung ca. 89,00 €", true);
    assert.equal(r.blockedInventedPrice, false);
    assert.match(r.text, /89/);
  });
});

describe("assistant/ai tool allowlist", () => {
  it("only known tools are allowlisted", () => {
    assert.equal(isAllowlistedTool("get_price_guidance"), true);
    assert.equal(isAllowlistedTool("resolve_product"), true);
    assert.equal(isAllowlistedTool("upsert_treppenhaus_fields"), true);
    assert.equal(isAllowlistedTool("get_treppenhaus_schema"), true);
    assert.equal(isAllowlistedTool("get_system_knowledge"), true);
    assert.equal(isAllowlistedTool("upsert_fenster_fields"), true);
    assert.equal(isAllowlistedTool("upsert_buero_fields"), true);
    assert.equal(isAllowlistedTool("open_service_case"), true);
    assert.equal(isAllowlistedTool("submit_customer_lead"), true);
    assert.equal(isAllowlistedTool("get_available_slots"), true);
    assert.equal(isAllowlistedTool("delete_all_leads"), false);
    assert.equal(isAllowlistedTool("set_festpreis"), false);
  });
});

describe("assistant/ai run — tool price is authoritative", () => {
  it("uses get_price_guidance → treppenhaus dialog ask (no invented euro)", async () => {
    const mock = new MockAiProvider([
      {
        type: "tool",
        name: "get_price_guidance",
        arguments: { message: "Was kostet Treppenhausreinigung?" },
      },
      { type: "text", content: "Das kostet bestimmt 999 € monatlich." },
    ]);

    const result = await runAssistantAi({
      message: "Was kostet Treppenhausreinigung?",
      session: createSession("ai1"),
      provider: mock,
    });

    assert.equal(result.meta.usedAi, true);
    assert.ok(result.meta.toolNames.includes("get_price_guidance"));
    assert.doesNotMatch(result.reply.text, /999/);
    assert.doesNotMatch(result.reply.text, /\d+[.,]\d+\s*€/);
    assert.match(result.reply.text, /Stockwerke/i);
  });

  it("blocks free-text invented euro when model skips tools", async () => {
    const mock = new MockAiProvider([
      { type: "text", content: "Praxisreinigung kostet 200 €." },
    ]);

    const result = await runAssistantAi({
      message: "Was kostet Praxis?",
      session: createSession("ai2"),
      provider: mock,
    });

    // Price ask without tool → forced policy (not model euro text)
    assert.ok(
      result.meta.fallbackReason === "forced_price_policy_without_tool" ||
        result.meta.fallbackReason === "blocked_invented_price"
    );
    assert.doesNotMatch(result.reply.text, /200/);
  });

  it("Preisliste without tool → corporate overview, not refusal", async () => {
    const mock = new MockAiProvider([
      {
        type: "text",
        content: "Leider kann ich keine Preislisten bereitstellen.",
      },
    ]);

    const result = await runAssistantAi({
      message: "merhaba fiyat listeniz nerede",
      session: createSession("ai3"),
      provider: mock,
    });

    assert.equal(result.meta.fallbackReason, "forced_price_policy_without_tool");
    assert.doesNotMatch(result.reply.text, /keine Preislisten bereitstellen/i);
    assert.match(result.reply.text, /Preisliste|Preisrechner|Festpreis/i);
  });
});

describe("assistant/ai process async — fallback without flags", () => {
  it("with flags off uses classic path (no AI)", async () => {
    const prevT = process.env.ASSISTANT_TOOLS_ENABLED;
    const prevA = process.env.ASSISTANT_AI_ENABLED;
    delete process.env.ASSISTANT_TOOLS_ENABLED;
    delete process.env.ASSISTANT_AI_ENABLED;

    const { reply, meta } = await processConciergeMessageAsync(
      "Hallo",
      createSession("p1")
    );
    assert.equal(meta.usedAi, false);
    assert.equal(meta.fallbackReason, "classic_concierge");
    assert.equal(reply.intent, "greeting");

    if (prevT === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prevT;
    if (prevA === undefined) delete process.env.ASSISTANT_AI_ENABLED;
    else process.env.ASSISTANT_AI_ENABLED = prevA;
  });

  it("AI enabled without key falls back safely", async () => {
    const prevT = process.env.ASSISTANT_TOOLS_ENABLED;
    const prevA = process.env.ASSISTANT_AI_ENABLED;
    const prevK = process.env.OPENAI_API_KEY;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    process.env.ASSISTANT_AI_ENABLED = "true";
    delete process.env.OPENAI_API_KEY;

    const { meta } = await processConciergeMessageAsync("Hallo", createSession("p2"));
    assert.equal(meta.usedAi, false);
    assert.equal(meta.fallbackReason, "ai_enabled_but_no_api_key");

    if (prevT === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prevT;
    if (prevA === undefined) delete process.env.ASSISTANT_AI_ENABLED;
    else process.env.ASSISTANT_AI_ENABLED = prevA;
    if (prevK === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevK;
  });

  it("tools-on + AI without key → Treppenhaus engine fallback (asks Stockwerke)", async () => {
    const prevT = process.env.ASSISTANT_TOOLS_ENABLED;
    const prevA = process.env.ASSISTANT_AI_ENABLED;
    const prevK = process.env.OPENAI_API_KEY;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    process.env.ASSISTANT_AI_ENABLED = "true";
    delete process.env.OPENAI_API_KEY;

    const { reply, meta } = await processConciergeMessageAsync(
      "Treppenhaus Preis?",
      createSession("p3")
    );

    assert.equal(meta.fallbackReason, "treppenhaus_collect");
    assert.match(reply.text, /Stockwerke/i);
    assert.doesNotMatch(reply.text, /\d+[.,]\d+\s*€/);

    if (prevT === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prevT;
    if (prevA === undefined) delete process.env.ASSISTANT_AI_ENABLED;
    else process.env.ASSISTANT_AI_ENABLED = prevA;
    if (prevK === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevK;
  });

  it("AI interprets NL via upsert_treppenhaus_fields — engine owns euro", async () => {
    const prevT = process.env.ASSISTANT_TOOLS_ENABLED;
    const prevA = process.env.ASSISTANT_AI_ENABLED;
    process.env.ASSISTANT_TOOLS_ENABLED = "true";
    process.env.ASSISTANT_AI_ENABLED = "true";

    const mock = new MockAiProvider([
      {
        type: "tool",
        name: "upsert_treppenhaus_fields",
        arguments: {
          stockwerke: 4,
          wohnungen: 6,
          stairTurnus: "weekly",
          dirtLevel: "heavy",
          keller: false,
        },
      },
    ]);

    const { reply, meta } = await processConciergeMessageAsync(
      "Treppenhaus: 4 Stock, 6 Wohnungen, 1 mal die Woche, stark, ohne Keller",
      createSession("p4"),
      undefined,
      mock
    );

    assert.equal(meta.usedAi, true);
    assert.ok(meta.toolNames.includes("upsert_treppenhaus_fields"));
    assert.match(reply.text, /610,14/);
    assert.match(reply.text, /brutto/i);

    if (prevT === undefined) delete process.env.ASSISTANT_TOOLS_ENABLED;
    else process.env.ASSISTANT_TOOLS_ENABLED = prevT;
    if (prevA === undefined) delete process.env.ASSISTANT_AI_ENABLED;
    else process.env.ASSISTANT_AI_ENABLED = prevA;
  });
});
