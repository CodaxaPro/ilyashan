import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";
import {
  trackPhoneClickConversion,
  trackRequestQuoteConversion,
  trackWhatsAppClickConversion,
} from "./google-ads.ts";

describe("google-ads conversions", () => {
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
    // siteConfig.requestQuoteSendTo is set — classic conversion also fires
    const conversion = calls.find((args) => args[1] === "conversion");
    assert.ok(conversion);
    assert.equal((conversion?.[2] as { send_to: string }).send_to, "AW-18351064202/2rxbCPeli6kdEIqJvK5E");
  });

  it("env send_to overrides config for classic conversion", () => {
    const prev = process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO;
    process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO = "AW-18351064202/testlabel";

    const calls: unknown[][] = [];
    (globalThis as { window: Window }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    } as Window;

    assert.equal(trackRequestQuoteConversion("ANF-9"), true);
    assert.ok(calls.some((args) => args[1] === "request_quote"));
    const conversion = calls.find((args) => args[1] === "conversion");
    assert.deepEqual(conversion?.[2], {
      send_to: "AW-18351064202/testlabel",
      value: 1.0,
      currency: "EUR",
      transaction_id: "ANF-9",
    });

    if (prev === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO;
    else process.env.NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO = prev;
  });

  it("fires whatsapp_click and phone_click events", () => {
    const calls: unknown[][] = [];
    (globalThis as { window: Window }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    } as Window;

    assert.equal(trackWhatsAppClickConversion(), true);
    assert.equal(trackPhoneClickConversion(), true);
    assert.ok(calls.some((args) => args[1] === "whatsapp_click"));
    assert.ok(calls.some((args) => args[1] === "phone_click"));
  });

  it("returns false when gtag is missing", () => {
    (globalThis as { window: Window }).window = {} as Window;
    assert.equal(trackRequestQuoteConversion(), false);
    assert.equal(trackWhatsAppClickConversion(), false);
    assert.equal(trackPhoneClickConversion(), false);
  });
});
