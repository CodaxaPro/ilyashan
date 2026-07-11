import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

describe("concierge-settings env override", () => {
  const original = process.env.CONCIERGE_ENABLED;

  beforeEach(() => {
    delete process.env.CONCIERGE_ENABLED;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.CONCIERGE_ENABLED;
    else process.env.CONCIERGE_ENABLED = original;
  });

  it("returns true when CONCIERGE_ENABLED=true", async () => {
    process.env.CONCIERGE_ENABLED = "true";
    const { getConciergeEnabled, getConciergeSettings } = await import("./concierge-settings");
    assert.equal(await getConciergeEnabled(), true);
    const settings = await getConciergeSettings();
    assert.equal(settings.enabled, true);
    assert.equal(settings.source, "env");
  });

  it("returns false when CONCIERGE_ENABLED=false", async () => {
    process.env.CONCIERGE_ENABLED = "false";
    const { getConciergeEnabled, getConciergeSettings } = await import("./concierge-settings");
    assert.equal(await getConciergeEnabled(), false);
    const settings = await getConciergeSettings();
    assert.equal(settings.enabled, false);
    assert.equal(settings.source, "env");
  });

  it("defaults to false without env or KV", async () => {
    const { getConciergeEnabled, getConciergeSettings } = await import("./concierge-settings");
    assert.equal(await getConciergeEnabled(), false);
    const settings = await getConciergeSettings();
    assert.equal(settings.enabled, false);
    assert.equal(settings.source, "default");
  });
});
