import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { siteConfig } from "@/lib/config";
import {
  DEFAULT_WHATSAPP_PREFILL,
  buildWhatsAppUrl,
  contactReachabilityLine,
} from "@/lib/contact-channels";
import { escapeHtml } from "@/lib/email-templates";
import { buildQuoteTableRows } from "@/lib/quote-summary";
import { initialQuoteFormData } from "@/lib/quote-form";

describe("contact-channels — corporate hierarchy", () => {
  it("WhatsApp URL targets firm number with corporate prefill", () => {
    const url = buildWhatsAppUrl();
    assert.match(url, /^https:\/\/wa\.me\/491733828354\?text=/);
    assert.ok(url.includes(encodeURIComponent(DEFAULT_WHATSAPP_PREFILL)));
    assert.match(DEFAULT_WHATSAPP_PREFILL, /Guten Tag/);
    assert.match(DEFAULT_WHATSAPP_PREFILL, /Angebot/);
    assert.doesNotMatch(DEFAULT_WHATSAPP_PREFILL, /Hallo, ich möchte eine Anfrage an Ilyashan senden/);
  });

  it("reachability line prioritizes written response window", () => {
    const line = contactReachabilityLine();
    assert.ok(line.includes(siteConfig.contact.hoursLine));
    assert.ok(line.includes(siteConfig.business.responseTime));
    assert.match(line, /Schriftliche Anfragen/i);
  });

  it("ctaAnfrage is multi-service; ctaPrimary stays fenster-specific", () => {
    assert.equal(siteConfig.messaging.ctaAnfrage, "Anfrage");
    assert.match(siteConfig.messaging.ctaPrimary, /Preis/i);
    assert.notEqual(siteConfig.messaging.ctaAnfrage, siteConfig.messaging.ctaPrimary);
  });
});

describe("email-templates — escapeHtml fail-soft", () => {
  it("does not throw on null/undefined table values", () => {
    assert.equal(escapeHtml(undefined), "");
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml("a & b"), "a &amp; b");
  });
});

describe("quote-summary — unknown enums never yield undefined cells", () => {
  it("maps known enums to defined string cells", () => {
    const rows = buildQuoteTableRows(
      {
        ...initialQuoteFormData,
        services: ["privat"],
        objectType: "wohnung",
        floorLevel: "eg",
        elevator: "ja",
        dirtLevel: "normal",
        cleaningSide: "innen_aussen",
        scheduleOption: "1-2_wochen",
        firstName: "Max",
        lastName: "Muster",
        phone: "0173",
        postalCode: "52062",
        city: "Aachen",
        privacyAccepted: true,
      },
      "ANG-TEST-1"
    );
    for (const [, value] of rows) {
      assert.equal(typeof value, "string");
      assert.ok(value.length > 0);
    }
  });
});
