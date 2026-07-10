import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isOutOfScope, OUT_OF_SCOPE_REPLY } from "./concierge/scope";

describe("concierge scope", () => {
  it("blocks unrelated topics", () => {
    assert.equal(isOutOfScope("Wie wird das Wetter morgen?"), true);
    assert.equal(isOutOfScope("Erzähl mir einen Witz"), true);
    assert.equal(isOutOfScope("Bitcoin Kurs heute"), true);
  });

  it("allows window cleaning topics", () => {
    assert.equal(isOutOfScope("Was kostet Fensterreinigung?"), false);
    assert.equal(isOutOfScope("12 Flügel in Baesweiler"), false);
    assert.equal(isOutOfScope("Hallo"), false);
  });

  it("provides German refusal text", () => {
    assert.match(OUT_OF_SCOPE_REPLY, /Fensterreinigung/);
    assert.match(OUT_OF_SCOPE_REPLY, /Ilyashan/);
  });
});
