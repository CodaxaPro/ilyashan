import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { siteConfig } from "./config";
import { processConciergeMessage } from "./concierge";

describe("concierge FAQ coverage", () => {
  for (const item of siteConfig.faq) {
    it(`answers: ${item.question}`, () => {
      const reply = processConciergeMessage(item.question);
      assert.ok(reply.text.length > 40, `short answer for: ${item.question}`);
      assert.notEqual(reply.intent, "out_of_scope");
    });
  }
});
