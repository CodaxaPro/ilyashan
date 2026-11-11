/**
 * Corporate channel matrix: E-Mail ≡ Admin persist ≡ WhatsApp (lead+fotos) ≡ surfaces.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initialQuoteFormData } from "@/lib/quote-form";
import { defaultQuotePricingContext } from "@/lib/quote-pricing-context";
import { buildQuoteAdminEmail, buildQuoteCustomerEmail } from "@/lib/quote-email";
import { buildWhatsAppQuoteMessage, getWhatsAppQuoteUrl } from "@/lib/whatsapp-quote";
import {
  MAX_EMAIL_PHOTO_ATTACHMENTS,
  MAX_PHOTOS,
  photosToResendAttachments,
  type PhotoPayload,
} from "@/lib/photo-upload";
import { buildLeadQuickReplyLinks } from "@/lib/lead-quick-reply";
import { siteConfig } from "@/lib/config";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function quote(overrides: Partial<typeof initialQuoteFormData> = {}) {
  return {
    ...initialQuoteFormData,
    services: ["privat" as const],
    objectType: "wohnung" as const,
    floorLevel: "eg" as const,
    elevator: "ja" as const,
    windowCount: 10,
    windowSize: "standard" as const,
    dirtLevel: "normal" as const,
    cleaningSide: "innen_aussen" as const,
    scheduleOption: "1-2_wochen" as const,
    firstName: "Max",
    lastName: "Mustermann",
    phone: "01733828354",
    email: "max@example.com",
    postalCode: "52062",
    city: "Aachen",
    privacyAccepted: true,
    ...overrides,
  };
}

function tinyPhoto(name = "a.jpg"): PhotoPayload {
  return {
    name,
    type: "image/jpeg",
    data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64"),
  };
}

const ctx = defaultQuotePricingContext();

describe("Corporate channels – E-Mail", () => {
  it("admin mail includes full detail rows, photo count, Schnellantwort CTAs", () => {
    const data = quote({ withFrame: true, dirtLevel: "stark" });
    const mail = buildQuoteAdminEmail(data, "ANG-CH-1", 3, ctx);
    assert.match(mail.subject, /ANG-CH-1/);
    assert.match(mail.text, /Fensterflügel/);
    assert.match(mail.text, /Fotos: 3/);
    assert.match(mail.html, /WhatsApp/);
    assert.match(mail.html, /Anrufen/);
    assert.match(mail.html, /Foto/);
  });

  it("customer mail has overview + price; no photo attachment claim", () => {
    const mail = buildQuoteCustomerEmail(quote(), "ANG-CH-2", ctx);
    assert.match(mail.subject, /ANG-CH-2/);
    assert.match(mail.text, /Fensterflügel|PLZ|Aachen/i);
    assert.doesNotMatch(mail.html, /Foto\(s\) im Anhang/);
  });

  it("contact route: save lead before mail, photos → Resend + KV", () => {
    const route = read("app/api/contact/route.ts");
    assert.match(route, /saveLead\(/);
    assert.match(route, /saveLeadPhotos/);
    assert.match(route, /photosToResendAttachments/);
    assert.match(route, /buildQuoteAdminEmail/);
    assert.match(route, /buildQuoteCustomerEmail/);
  });
});

describe("Corporate channels – WhatsApp", () => {
  it("WA message mirrors quote fields + optional Anfrage-Nr / Foto-Hinweis", () => {
    const data = quote({ windowCount: 14, withFalz: true });
    const plain = buildWhatsAppQuoteMessage(data, ctx);
    assert.match(plain, /14/);
    assert.match(plain, /Fugen|Falz/i);
    assert.match(plain, /inkl\. MwSt|Live-Preisschätzung/i);

    const withMeta = buildWhatsAppQuoteMessage(data, ctx, {
      anfrageNr: "ANG-WA-9",
      photoCount: 4,
    });
    assert.match(withMeta, /ANG-WA-9/);
    assert.match(withMeta, /Fotos: 4/);
    assert.match(withMeta, /Admin\/E-Mail/);
  });

  it("WA URL targets firm number", () => {
    const url = getWhatsAppQuoteUrl(quote(), ctx, { anfrageNr: "ANG-1", photoCount: 2 });
    assert.match(url, /api\.whatsapp\.com\/send/);
    assert.match(url, new RegExp(`phone=${siteConfig.contact.whatsapp}`));
    assert.match(url, /text=/);
    assert.ok(url.includes(encodeURIComponent("ANG-1")));
  });

  it("Step5 WhatsApp persists lead+photos via /api/contact before opening chat", () => {
    const step5 = read("components/quote/steps/Step5Contact.tsx");
    assert.match(step5, /submitByWhatsApp/);
    assert.match(step5, /persistQuoteLead/);
    assert.match(step5, /channel: "whatsapp"/);
    assert.match(step5, /window\.open\(waUrl/);
    assert.match(step5, /photoCount: photos\.length/);
    assert.doesNotMatch(step5, /variant=\"whatsapp\"/);
    assert.doesNotMatch(step5, /href=\{canSubmit \? getWhatsAppQuoteUrl/);
  });
});

describe("Corporate channels – Fotos", () => {
  it("limits: 20 upload, 10 email attachments as Buffer", () => {
    assert.equal(MAX_PHOTOS, 20);
    assert.equal(MAX_EMAIL_PHOTO_ATTACHMENTS, 10);
    const many = Array.from({ length: 12 }, (_, i) => tinyPhoto(`f${i}.jpg`));
    const atts = photosToResendAttachments(many);
    assert.equal(atts.length, 10);
    assert.ok(Buffer.isBuffer(atts[0].content));
  });

  it("admin panel + API expose photo gallery", () => {
    const panel = read("components/admin/AdminLeadDetailPanel.tsx");
    const api = read("app/api/admin/leads/[id]/route.ts");
    assert.match(panel, /admin-lead-photos/);
    assert.match(panel, /detailRows\.map\(/);
    assert.doesNotMatch(panel, /detailRows\.slice\(/);
    assert.match(api, /getLeadPhotos/);
  });
});

describe("Corporate channels – Schnellantwort brand", () => {
  it("admin quick reply uses api.whatsapp.com + DE phone", () => {
    const links = buildLeadQuickReplyLinks({
      name: "Max Mustermann",
      phone: "0173 3828354",
      email: "max@example.com",
      anfrageNr: "ANG-QR",
      services: "Fensterreinigung",
      festpreis: 199,
      audience: "privat",
    });
    assert.ok(links.whatsappHref?.includes("api.whatsapp.com/send"));
    assert.ok(links.whatsappHref?.includes("phone=491733828354"));
    assert.ok(links.callHref?.startsWith("tel:"));
  });
});
