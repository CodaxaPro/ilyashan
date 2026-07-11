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

  it("parses utm parameters", () => {
    const attr = parseAttributionFromUrl(
      "https://ilyashan.de/de?utm_source=newsletter&utm_medium=email&utm_campaign=spring",
      ""
    );
    assert.equal(attr.utmSource, "newsletter");
    assert.equal(attr.utmMedium, "email");
    assert.equal(attr.channel, "email");
  });
});
