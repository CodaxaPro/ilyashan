import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";
import { trackRequestQuoteConversion } from "./google-ads.ts";

describe("trackRequestQuoteConversion", () => {
  afterEach(() => {
    mock.restoreAll();
    delete (globalThis as { window?: Window }).window;
  });

  it("fires request_quote event when gtag is available", () => {
    const calls: unknown[][] = [];
    (globalThis as { window: Window }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    } as Window;

    const tracked = trackRequestQuoteConversion("ANF-123");

    assert.equal(tracked, true);
    assert.ok(calls.some((args) => args[0] === "event" && args[1] === "request_quote"));
    const quoteEvent = calls.find((args) => args[1] === "request_quote");
    assert.deepEqual(quoteEvent?.[2], { transaction_id: "ANF-123" });
  });

  it("returns false when gtag is missing", () => {
    (globalThis as { window: Window }).window = {} as Window;
    assert.equal(trackRequestQuoteConversion(), false);
  });
});
