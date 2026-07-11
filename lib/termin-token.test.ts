import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  createTerminToken,
  verifyTerminToken,
  buildTerminPageUrl,
  isTerminTokenConfigured,
} from "./termin-token";

describe("termin token", () => {
  const prevAdmin = process.env.ADMIN_PASSWORD;
  const prevSecret = process.env.TERMIN_TOKEN_SECRET;

  before(() => {
    process.env.TERMIN_TOKEN_SECRET = "test-secret-key";
    delete process.env.ADMIN_PASSWORD;
  });

  after(() => {
    if (prevSecret === undefined) delete process.env.TERMIN_TOKEN_SECRET;
    else process.env.TERMIN_TOKEN_SECRET = prevSecret;
    if (prevAdmin === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prevAdmin;
  });

  it("is configured when secret exists", () => {
    assert.equal(isTerminTokenConfigured(), true);
  });

  it("creates and verifies valid token", () => {
    const token = createTerminToken("lead-abc");
    assert.ok(token);
    const payload = verifyTerminToken(token);
    assert.equal(payload?.leadId, "lead-abc");
    assert.ok(payload && payload.exp > Date.now());
  });

  it("rejects tampered token", () => {
    const token = createTerminToken("lead-abc");
    assert.ok(token);
    const tampered = token!.slice(0, -2) + "xx";
    assert.equal(verifyTerminToken(tampered), null);
  });

  it("builds termin page url", () => {
    const url = buildTerminPageUrl("https://ilyashan.de", "lead-xyz");
    assert.ok(url?.startsWith("https://ilyashan.de/termin?token="));
  });
});
