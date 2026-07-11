import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatFromLabel, parseReferrerDomain, resolvePageviewContext } from "./page-context";

describe("page-context", () => {
  it("parses referrer domain", () => {
    assert.equal(parseReferrerDomain("https://m.facebook.com/foo?bar=1"), "m.facebook.com");
  });

  it("uses external referrer on first pageview", () => {
    const ctx = resolvePageviewContext({
      documentReferrer: "https://m.facebook.com/l.php?u=https%3A%2F%2Filyashan.de",
      pageHref: "https://ilyashan.de/de?utm_source=fb",
      pagePathWithSearch: "/de?utm_source=fb",
      previousPathWithSearch: "",
      origin: "https://ilyashan.de",
    });
    assert.equal(ctx.fromType, "external");
    assert.equal(ctx.fromUrl, "https://m.facebook.com/l.php?u=https%3A%2F%2Filyashan.de");
    assert.equal(ctx.pageUrl, "https://ilyashan.de/de?utm_source=fb");
  });

  it("uses previous internal path on SPA navigation", () => {
    const ctx = resolvePageviewContext({
      documentReferrer: "https://m.facebook.com/",
      pageHref: "https://ilyashan.de/angebot",
      pagePathWithSearch: "/angebot",
      previousPathWithSearch: "/de",
      origin: "https://ilyashan.de",
    });
    assert.equal(ctx.fromType, "internal");
    assert.equal(ctx.fromPath, "/de");
    assert.equal(ctx.fromUrl, "https://ilyashan.de/de");
  });

  it("formats from label for display", () => {
    assert.equal(
      formatFromLabel({
        fromType: "external",
        fromUrl: "https://m.facebook.com/l.php?u=test",
        fromPath: "",
        referrer: "https://m.facebook.com/",
      }),
      "https://m.facebook.com/l.php?u=test"
    );
  });
});
