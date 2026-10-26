import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";
import { INTENT_SEO_LINKS } from "@/lib/landing-pages";

describe("sitemap coverage", () => {
  it("includes indexable intent landings (soft-launch regression)", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    assert.ok(urls.length >= 300, `expected ~300+ URLs, got ${urls.length}`);

    const intentInSitemap = urls.filter((u) =>
      /\/(fensterputzer|glasreinigung|fensterreinigung-preis)-/.test(u)
    );
    assert.ok(intentInSitemap.length > 40, "intent city URLs missing from sitemap");

    const excluded = INTENT_SEO_LINKS.filter((p) => p.type === "gebaeudereinigung");
    for (const page of excluded) {
      assert.equal(
        urls.some((u) => u.endsWith(page.path)),
        false,
        `gebaeudereinigung should stay out of sitemap: ${page.path}`
      );
    }
  });
});
