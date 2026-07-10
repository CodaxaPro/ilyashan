import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent } from "./concierge/intent";

describe("concierge intent", () => {
  it("classifies greetings", () => {
    assert.equal(classifyIntent("Hallo"), "greeting");
    assert.equal(classifyIntent("Guten Tag"), "greeting");
    assert.equal(classifyIntent("Moin"), "greeting");
  });

  it("classifies price questions", () => {
    assert.equal(classifyIntent("Was kostet Fensterreinigung?"), "price");
    assert.equal(classifyIntent("Wie teuer sind 10 Fenster?"), "price_collect");
  });

  it("classifies services and area", () => {
    assert.equal(classifyIntent("Welche Leistungen bieten Sie?"), "services");
    assert.equal(classifyIntent("Einsatzgebiet Aachen"), "area");
    assert.equal(classifyIntent("Fallen Anfahrtskosten an?"), "area");
  });

  it("classifies process and festpreis", () => {
    assert.equal(classifyIntent("Wie funktioniert der Preisrechner?"), "process");
    assert.equal(classifyIntent("Unterschied Preisschätzung und Festpreis"), "festpreis_info");
  });

  it("classifies fluegel help", () => {
    assert.equal(classifyIntent("Wie zähle ich Flügel?"), "fluegel_help");
  });

  it("classifies out of scope", () => {
    assert.equal(classifyIntent("Wetter morgen"), "out_of_scope");
  });

  it("classifies contact", () => {
    assert.equal(classifyIntent("Wie erreiche ich Sie telefonisch?"), "contact");
  });
});
