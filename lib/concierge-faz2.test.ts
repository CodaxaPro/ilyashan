import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSession } from "./concierge/types";
import { buildConciergeWhatsAppMessage, getConciergeWhatsAppUrl } from "./concierge/whatsapp-handoff";
import { getProactiveNudge, getProactivePage } from "./concierge/proactive";
import { isHotLead, validateLeadContact, buildLeadSummaryRows } from "./concierge/lead";
import { buildConciergeLeadAdminEmail } from "./concierge-email";

describe("concierge faz2 – whatsapp handoff", () => {
  it("includes price in WhatsApp message", () => {
    const session = createSession("wa-test");
    session.quote = {
      services: ["privat"],
      windowCount: 10,
      floorLevel: "og2",
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
      roomHeight: 2.5,
    };
    session.stage = "price_ready";

    const msg = buildConciergeWhatsAppMessage(session);
    assert.match(msg, /10/);
    assert.match(msg, /Fensterflügel/);
    assert.match(msg, /Live-Preisschätzung/);
    assert.match(msg, /Festpreis-Angebot/);
  });

  it("builds valid wa.me URL", () => {
    const session = createSession("wa-url");
    const url = getConciergeWhatsAppUrl(session);
    assert.match(url, /^https:\/\/wa\.me\/\d+\?text=/);
  });
});

describe("concierge faz2 – proactive", () => {
  it("detects page context", () => {
    assert.equal(getProactivePage("/de"), "home");
    assert.equal(getProactivePage("/de/angebot"), "angebot");
    assert.equal(getProactivePage("/de/impressum"), "other");
  });

  it("returns page-specific nudge text", () => {
    assert.match(getProactiveNudge("/de/angebot"), /Kalkulation|Flügel/i);
    assert.match(getProactiveNudge("/de"), /Live-Preisschätzung/i);
  });
});

describe("concierge faz2 – lead", () => {
  it("detects hot lead after price", () => {
    const session = createSession("lead");
    session.stage = "price_ready";
    session.quote.windowCount = 12;
    session.quote.floorLevel = "eg";
    assert.equal(isHotLead(session), true);
  });

  it("validates contact fields", () => {
    assert.equal(validateLeadContact("", "0173123"), "Bitte geben Sie Ihren Namen an.");
    assert.equal(validateLeadContact("Max", "12"), "Bitte geben Sie eine gültige Telefonnummer an.");
    assert.equal(validateLeadContact("Max Mustermann", "0173 3828354"), null);
  });

  it("builds admin email with summary", () => {
    const session = createSession("email");
    session.stage = "price_ready";
    session.quote.windowCount = 8;
    session.quote.floorLevel = "eg";

    const email = buildConciergeLeadAdminEmail(session, "Anna Test", "0173 1111111");
    assert.match(email.subject, /Anna Test/);
    assert.match(email.text, /Fensterflügel: 8/);
    assert.match(email.html, /Heiße Anfrage|heiße Anfrage|Live-Preisschätzung/i);
    assert.ok(buildLeadSummaryRows(session).length >= 3);
  });
});
