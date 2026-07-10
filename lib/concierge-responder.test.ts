import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processConciergeMessage, createSession } from "./concierge";
import { siteConfig } from "./config";

describe("concierge responder", () => {
  it("greets professionally", () => {
    const reply = processConciergeMessage("Hallo");
    assert.equal(reply.intent, "greeting");
    assert.match(reply.text, /Ilyashan/);
    assert.match(reply.text, /Live-Preisschätzung/);
    assert.ok(reply.actions.some((a) => a.href.includes("/angebot")));
  });

  it("refuses out of scope", () => {
    const reply = processConciergeMessage("Wie wird das Wetter?");
    assert.equal(reply.intent, "out_of_scope");
    assert.match(reply.text, /Fensterreinigung/);
  });

  it("lists services", () => {
    const reply = processConciergeMessage("Welche Leistungen bieten Sie?");
    assert.equal(reply.intent, "services");
    assert.match(reply.text, /Privathaushalt/);
    assert.match(reply.text, /Gewerbe/);
  });

  it("explains service area without travel fee", () => {
    const reply = processConciergeMessage("Einsatzgebiet und Anfahrt");
    assert.equal(reply.intent, "area");
    assert.match(reply.text, /Anfahrtszuschlag/);
    assert.match(reply.text, /Baesweiler/);
  });

  it("explains festpreis vs schätzung", () => {
    const reply = processConciergeMessage("Unterschied Live-Preisschätzung und Festpreis-Angebot");
    assert.equal(reply.intent, "festpreis_info");
    assert.match(reply.text, /unverbindlich/i);
    assert.match(reply.text, /verbindlich/i);
  });

  it("answers FAQ about cost", () => {
    const reply = processConciergeMessage("Was kostet eine Fensterreinigung?");
    assert.ok(["price", "price_collect", "faq_match"].includes(reply.intent));
    assert.match(reply.text, /Flügel|Live-Preisschätzung|Wizard|€/i);
  });

  it("collects price info step by step", () => {
    let session = createSession("test");
    let reply = processConciergeMessage("Was kostet meine Reinigung?", session);
    assert.equal(reply.intent, "price_collect");
    assert.match(reply.text, /Flügel/i);
    session = reply.session;

    reply = processConciergeMessage("12 Flügel", session);
    assert.match(reply.text, /Etage|Stock/i);
    session = reply.session;

    reply = processConciergeMessage("2. Stock Baesweiler", session);
    assert.match(reply.text, /Live-Preisschätzung/i);
    assert.ok(reply.text.includes("€"), "expected euro amount");
    assert.match(reply.text, /verbindlich/i);
    assert.ok(reply.actions.some((a) => a.label.includes("berechnen") || a.href.includes("/angebot")));
  });

  it("calculates price with full details in one message", () => {
    const reply = processConciergeMessage("10 Flügel, 2. OG, Baesweiler, nur außen");
    assert.ok(reply.text.includes("€"), "expected euro amount");
    assert.ok(reply.text.includes(siteConfig.business.responseTime));
  });

  it("explains fluegel counting", () => {
    const reply = processConciergeMessage("Wie zähle ich Flügel?");
    assert.equal(reply.intent, "fluegel_help");
    assert.match(reply.text, /Flügel/);
    assert.match(reply.text, /Beispiel/i);
  });

  it("provides contact details", () => {
    const reply = processConciergeMessage("Kontakt Telefon");
    assert.equal(reply.intent, "contact");
    assert.match(reply.text, /0173/);
    assert.match(reply.text, /info@ilyashan/);
  });

  it("answers insurance question", () => {
    const reply = processConciergeMessage("Sind Sie versichert?");
    assert.equal(reply.intent, "insurance");
    assert.match(reply.text, /versichert/i);
  });

  it("answers winter question", () => {
    const reply = processConciergeMessage("Reinigen Sie im Winter?");
    assert.equal(reply.intent, "winter");
    assert.match(reply.text, /5\s*°C/);
  });

  it("includes trust signals in price response", () => {
    const reply = processConciergeMessage("8 Flügel EG");
    assert.ok(reply.text.includes("€"), "expected euro in price response");
    assert.match(reply.text, /Streifenfrei|Anfahrtszuschlag|versichert|Google/i);
  });

  it("provides quick replies", () => {
    const reply = processConciergeMessage("Hallo");
    assert.ok(reply.quickReplies.length >= 3);
  });
});
