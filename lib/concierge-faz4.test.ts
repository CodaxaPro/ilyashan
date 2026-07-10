import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PHOTOS,
  normalizePhotoPayloads,
  photosToResendAttachments,
  validatePhotos,
  type PhotoPayload,
} from "./photo-upload";
import {
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "./admin-auth";
import { trackConciergeEvent } from "./concierge-analytics";
import { createSession } from "./concierge/types";
import { createConciergeStoredLead, createQuoteStoredLead } from "./lead-records";
import { initialQuoteFormData } from "./quote-form";
import { buildConciergeLeadAdminEmail } from "./concierge-email";

describe("photo-upload", () => {
  const validPhoto: PhotoPayload = {
    name: "fenster.jpg",
    type: "image/jpeg",
    data: Buffer.from("fake-image").toString("base64"),
  };

  it("validates allowed photos", () => {
    assert.equal(validatePhotos([validPhoto]), null);
  });

  it("rejects too many photos", () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, () => validPhoto);
    assert.match(validatePhotos(photos) ?? "", /Maximal/);
  });

  it("rejects unsupported mime types", () => {
    assert.match(
      validatePhotos([{ ...validPhoto, type: "application/pdf" }]) ?? "",
      /JPG|PNG|WebP/
    );
  });

  it("normalizes and maps to resend attachments", () => {
    const photos = normalizePhotoPayloads([validPhoto, { foo: "bar" }]);
    assert.equal(photos.length, 1);
    const attachments = photosToResendAttachments(photos);
    assert.equal(attachments[0].filename, "fenster.jpg");
    assert.equal(attachments[0].content, validPhoto.data);
  });
});

describe("admin-auth", () => {
  it("requires ADMIN_PASSWORD to be configured", () => {
    const original = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    assert.equal(isAdminConfigured(), false);
    process.env.ADMIN_PASSWORD = original;
  });

  it("creates and verifies session token", () => {
    process.env.ADMIN_PASSWORD = "test-admin-secret";
    assert.equal(verifyAdminPassword("test-admin-secret"), true);
    assert.equal(verifyAdminPassword("wrong"), false);
    const token = createAdminSessionToken();
    assert.ok(token);
    assert.equal(verifyAdminSessionToken(token), true);
    assert.equal(verifyAdminSessionToken("invalid.token"), false);
    delete process.env.ADMIN_PASSWORD;
  });
});

describe("concierge-analytics", () => {
  it("fires gtag concierge events when available", () => {
    const calls: unknown[] = [];
    (globalThis as { window?: { gtag?: (...args: unknown[]) => void } }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    assert.equal(trackConciergeEvent("concierge_open", { page_path: "/de" }), true);
    assert.equal(calls[0]?.[0], "event");
    assert.equal(calls[0]?.[1], "concierge_open");

    delete (globalThis as { window?: unknown }).window;
  });

  it("returns false without gtag", () => {
    delete (globalThis as { window?: unknown }).window;
    assert.equal(trackConciergeEvent("concierge_open"), false);
  });
});

describe("concierge faz4 – lead records & email", () => {
  it("builds quote stored lead", () => {
    const quote = {
      ...initialQuoteFormData,
      services: ["privat" as const],
      objectType: "wohnung" as const,
      floorLevel: "eg" as const,
      elevator: "unbekannt" as const,
      windowCount: 8,
      firstName: "Max",
      lastName: "Mustermann",
      phone: "01731234567",
      postalCode: "52499",
      city: "Baesweiler",
      privacyAccepted: true,
    };

    const lead = createQuoteStoredLead(quote, "ANG-2026-123456", 2);
    assert.equal(lead.source, "quote");
    assert.equal(lead.photoCount, 2);
    assert.match(lead.summary, /Max Mustermann/);
  });

  it("builds concierge stored lead with hot flag", () => {
    const session = createSession("f4");
    session.stage = "price_ready";
    session.quote.windowCount = 10;
    session.quote.floorLevel = "og2";

    const lead = createConciergeStoredLead(session, "Anna", "01739876543", 1);
    assert.equal(lead.hot, true);
    assert.equal(lead.photoCount, 1);
  });

  it("includes photo count in concierge admin email", () => {
    const session = createSession("mail");
    const email = buildConciergeLeadAdminEmail(session, "Max", "0173123", 2);
    assert.match(email.html, /2 im Anhang/);
    assert.match(email.text, /Fotos: 2/);
  });
});
