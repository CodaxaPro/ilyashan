import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildQuoteAdminEmail } from "./quote-email";
import { buildAdminNotificationEmail } from "./email";
import { buildButton } from "./email-templates";
import { initialQuoteFormData } from "./quote-form";
import {
  buildCustomerWhatsAppUrl,
  toTelHref,
  toWhatsAppIntlDigits,
} from "./phone-de";

describe("phone-de", () => {
  it("normalizes DE formats to intl digits", () => {
    assert.equal(toWhatsAppIntlDigits("0173 3828354"), "491733828354");
    assert.equal(toWhatsAppIntlDigits("+49 173-382-8354"), "491733828354");
    assert.equal(toWhatsAppIntlDigits("00491733828354"), "491733828354");
    assert.equal(toWhatsAppIntlDigits("123"), null);
  });

  it("builds clickable customer WhatsApp URL", () => {
    const url = buildCustomerWhatsAppUrl("0173 3828354", "Hallo Anna");
    assert.ok(url);
    assert.match(url!, /^https:\/\/api\.whatsapp\.com\/send\?phone=491733828354&text=/);
    assert.match(decodeURIComponent(url!), /Hallo Anna/);
  });

  it("tel href keeps dialable form", () => {
    assert.equal(toTelHref("0173 3828354"), "tel:01733828354");
    assert.equal(toTelHref("12"), null);
  });
});

describe("admin email WhatsApp buttons – end-to-end", () => {
  it("quote admin mail: WhatsApp button has escaped href + target blank", () => {
    const email = buildQuoteAdminEmail(
      {
        ...initialQuoteFormData,
        services: ["privat"],
        objectType: "wohnung",
        floorLevel: "eg",
        elevator: "ja",
        windowCount: 8,
        windowSize: "large",
        firstName: "Cem",
        lastName: "Hancer",
        phone: "0173-382-8354",
        email: "cem@test.de",
        postalCode: "52499",
        city: "Baesweiler",
        privacyAccepted: true,
      },
      "ANG-WA-E2E"
    );

    assert.match(email.html, /api\.whatsapp\.com\/send\?phone=491733828354&amp;text=/);
    assert.match(email.html, /target="_blank"/);
    assert.match(email.html, />WhatsApp</);
    // Raw unescaped & in href would break Webmail parsers
    assert.doesNotMatch(email.html, /href="https:\/\/api\.whatsapp\.com\/send\?phone=\d+&text=/);
  });

  it("contact admin mail: WhatsApp button same contract", () => {
    const email = buildAdminNotificationEmail({
      name: "Anna Test",
      phone: "01733828354",
      email: "a@test.de",
      plz: "52499",
      service: "privat",
      message: "Bitte anrufen",
    });
    assert.match(email.html, /api\.whatsapp\.com\/send\?phone=491733828354&amp;text=/);
    assert.match(email.html, /target="_blank"/);
  });

  it("buildButton escapes mailto query ampersands", () => {
    const html = buildButton(
      "mailto:a@test.de?subject=Hi&body=Hallo",
      "Mail",
      "#059669"
    );
    assert.match(html, /href="mailto:a@test\.de\?subject=Hi&amp;body=Hallo"/);
  });
});
