import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAttributionFromUrl, resolveChannel } from "./attribution";

describe("analytics attribution", () => {
  it("detects google ads cpc via gclid", () => {
    const attr = parseAttributionFromUrl(
      "https://ilyashan.de/de/angebot?gclid=abc123&utm_source=google",
      ""
    );
    assert.equal(attr.channel, "cpc");
    assert.equal(attr.gclid, "abc123");
  });

  it("detects organic search referrer", () => {
    const channel = resolveChannel({
      referrerDomain: "www.google.de",
    });
    assert.equal(channel, "organic");
  });

  it("detects direct traffic", () => {
    const channel = resolveChannel({});
    assert.equal(channel, "direct");
  });

  it("detects facebook via fbclid", () => {
    const attr = parseAttributionFromUrl("https://ilyashan.de/de?fbclid=IwAR123", "");
    assert.equal(attr.fbclid, "IwAR123");
    assert.equal(attr.channel, "social");
  });
});
