/**
 * Voice enterprise: mid-call tools reuse chat engines (price / slots / book / callback).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseVoiceToolInvocation, normalizeFloorLevel } from "@/lib/voice/tools";
import { buildVapiAssistantCreateBody, buildVapiAssistantTools } from "@/lib/voice/vapi-assistant";

const ROOT = join(__dirname, "../../..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("voice enterprise tools", () => {
  it("registers four mid-call tools on Vapi assistant body", () => {
    const body = buildVapiAssistantCreateBody(
      "https://ilyashan.de/api/voice/inbound?secret=test"
    );
    const model = body.model as { tools?: unknown[] };
    assert.ok(Array.isArray(model.tools));
    assert.equal(model.tools.length, 4);
    const tools = buildVapiAssistantTools(
      "https://ilyashan.de/api/voice/inbound?secret=test"
    ) as Array<{ function: { name: string }; server: { url: string } }>;
    const names = tools.map((t) => t.function.name).sort();
    assert.deepEqual(names, [
      "book_appointment",
      "get_available_slots",
      "price_fenster",
      "request_callback",
    ]);
    assert.match(tools[0].server.url, /\/api\/voice\/tools/);
  });

  it("parses Vapi tool-calls payload", () => {
    const parsed = parseVoiceToolInvocation({
      message: {
        type: "tool-calls",
        toolCalls: [
          {
            id: "tc1",
            function: {
              name: "price_fenster",
              arguments: JSON.stringify({ windowCount: 12, floorLevel: "eg" }),
            },
          },
        ],
      },
    });
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].name, "price_fenster");
    assert.equal(parsed[0].args.windowCount, 12);
  });

  it("normalizes German floor labels", () => {
    assert.equal(normalizeFloorLevel("EG"), "eg");
    assert.equal(normalizeFloorLevel("1. OG"), "og1");
    assert.equal(normalizeFloorLevel("Dachgeschoss"), "dg");
  });

  it("tools route + inbound preferredDates wiring exist", () => {
    assert.match(read("app/api/voice/tools/route.ts"), /runVoiceTool/);
    assert.match(read("lib/voice/inbound.ts"), /preferredDates/);
    assert.match(read("lib/voice/vapi-assistant.ts"), /book_appointment/);
  });
});
