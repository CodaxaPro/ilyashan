import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fuzzyWordMatch,
  levenshteinDistance,
  messageFingerprint,
  normalizeConciergeText,
} from "./concierge/fuzzy";
import { matchFaq, findFaqAnswer, suggestFaqForUnknown } from "./concierge/faq-match";
import { classifyIntent } from "./concierge/intent";
import { processConciergeMessage } from "./concierge/responder";
import { shouldLogUnknownMessage } from "./concierge/unknown-queue";

describe("concierge faz5 – fuzzy text", () => {
  it("normalizes umlauts and punctuation", () => {
    assert.equal(normalizeConciergeText("Preiß-Schätzung!"), "preiss schaetzung");
    assert.equal(normalizeConciergeText("Flügel-Zählung"), "fluegel zaehlung");
  });

  it("matches close typos", () => {
    assert.equal(fuzzyWordMatch("fenster", "fenstr"), true);
    assert.equal(fuzzyWordMatch("preisschaetzung", "preisschaetzung"), true);
    assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  });

  it("builds stable fingerprint", () => {
    const a = messageFingerprint("Was kostet  Fenster???");
    const b = messageFingerprint("was kostet fenster");
    assert.equal(a, b);
  });
});

describe("concierge faz5 – faq match", () => {
  it("matches FAQ via alias", () => {
    const result = matchFaq("wie teuer ist fensterreinigung");
    assert.ok(result);
    assert.equal(result.id, "cost");
    assert.ok(["alias", "fuzzy", "keyword"].includes(result.method));
  });

  it("matches FAQ with typos via fuzzy", () => {
    const answer = findFaqAnswer("sind sie versichert haftpflicht");
    assert.ok(answer);
    assert.match(answer, /Betriebshaftpflicht/);
  });

  it("matches winter FAQ with typo", () => {
    const result = matchFaq("fensterreinigung im winter bei kaelt");
    assert.ok(result);
    assert.equal(result.id, "winter");
  });

  it("suggests weak FAQ match for unknown queue", () => {
    const suggestion = suggestFaqForUnknown("zahlung bar ec");
    assert.ok(suggestion);
    assert.equal(suggestion.id, "zahlung");
  });
});

describe("concierge faz5 – intent + unknown logging", () => {
  it("classifies typo price questions", () => {
    assert.equal(classifyIntent("was kostet fenster putzen"), "price");
    assert.equal(classifyIntent("wie teuer fensterreinigung"), "price");
  });

  it("classifies fluegel help with typo", () => {
    assert.equal(classifyIntent("wie zaehle ich fluegel"), "fluegel_help");
  });

  it("answers alias FAQ through responder", () => {
    const reply = processConciergeMessage("anfahrt kostenlos aachen");
    assert.equal(reply.intent, "faq_match");
    assert.match(reply.text, /keinen Anfahrtszuschlag/i);
  });

  it("flags unknown intent for logging", () => {
    assert.equal(shouldLogUnknownMessage("unknown"), true);
    assert.equal(shouldLogUnknownMessage("price"), false);
  });

  it("returns unknown for unrelated in-scope vague text", () => {
    const reply = processConciergeMessage("habt ihr auch samstags offen");
    assert.equal(reply.intent, "unknown");
  });
});
