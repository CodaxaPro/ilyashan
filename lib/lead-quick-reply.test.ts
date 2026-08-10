import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLeadOfferMailtoBody,
  buildLeadOfferWhatsAppText,
  buildLeadQuickReplyLinks,
  cleanLeadPhone,
} from "./lead-quick-reply";

describe("lead-quick-reply", () => {
  it("normalizes DE phone for WhatsApp", () => {
    assert.equal(cleanLeadPhone("0241 123456"), "49241123456");
    assert.equal(cleanLeadPhone("+49 241 123456"), "49241123456");
  });

  it("uses admin Festpreis with MwSt for privat in all offer channels", () => {
    const links = buildLeadQuickReplyLinks({
      name: "Anna Schmidt",
      phone: "0241 123456",
      email: "anna@test.de",
      anfrageNr: "ANG-2026-1",
      services: "Fensterreinigung Privat",
      festpreis: 125,
      audience: "privat",
      estimateLabel: "ca. 119 € – 131 € inkl. MwSt.",
    });
    assert.equal(links.isFestpreis, true);
    assert.match(links.priceLabel, /125\s*€ inkl\. MwSt/);
    assert.ok(links.callHref?.startsWith("tel:"));
    assert.ok(links.whatsappHref?.includes("wa.me/"));
    assert.ok(links.mailtoHref?.startsWith("mailto:anna@test.de"));

    const wa = decodeURIComponent(links.whatsappHref!);
    assert.match(wa, /verbindlicher Festpreis/);
    assert.match(wa, /125/);
    assert.doesNotMatch(wa, /119 € – 131/);

    const mail = decodeURIComponent(links.mailtoHref!);
    assert.match(mail, /verbindlicher Festpreis/);
    assert.match(mail, /inkl\. MwSt/);
  });

  it("uses Netto/Brutto Festpreis for gewerbe", () => {
    const links = buildLeadQuickReplyLinks({
      name: "Firma GmbH",
      phone: "0241 999",
      email: "b@firma.de",
      anfrageNr: "ANG-G",
      services: "Gewerbe",
      festpreis: 125,
      audience: "gewerbe",
    });
    assert.match(links.priceLabel, /Netto/);
    assert.match(links.priceLabel, /Brutto 125/);
    const wa = decodeURIComponent(links.whatsappHref!);
    assert.match(wa, /Netto|Brutto/);
  });

  it("falls back to Schätzung when Festpreis missing", () => {
    const links = buildLeadQuickReplyLinks({
      name: "Anna",
      phone: "0241 1",
      email: "a@test.de",
      anfrageNr: "ANG-2",
      services: "Privat",
      audience: "privat",
      estimateLabel: "ca. 100 € – 110 € inkl. MwSt.",
    });
    assert.equal(links.isFestpreis, false);
    assert.match(links.priceLabel, /100/);
    const wa = decodeURIComponent(links.whatsappHref!);
    assert.match(wa, /unverbindliche Preisschätzung/i);
    assert.doesNotMatch(wa, /verbindlicher Festpreis/);
  });

  it("mailto / WhatsApp helpers mark binding vs estimate", () => {
    assert.match(
      buildLeadOfferMailtoBody("A", "Privat", "125 € inkl. MwSt.", true),
      /verbindlicher Festpreis/
    );
    assert.match(
      buildLeadOfferWhatsAppText("A", "Privat", "ca. 100 €", false),
      /Unverbindliche Preisschätzung/
    );
  });
});
