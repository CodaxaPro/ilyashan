import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_EMAIL_PHOTO_ATTACHMENTS,
  MAX_PHOTOS,
  normalizePhotoPayloads,
  photoLimitHelperTextDe,
  photosToResendAttachments,
  validatePhotos,
  type PhotoPayload,
} from "./photo-upload";

function samplePhoto(overrides: Partial<PhotoPayload> = {}): PhotoPayload {
  return {
    name: "fenster.jpg",
    type: "image/jpeg",
    data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64"),
    ...overrides,
  };
}

describe("photo-upload – Resend attachments", () => {
  it("builds Buffer + contentType for reliable image attachments", () => {
    const attachments = photosToResendAttachments([samplePhoto()]);
    assert.equal(attachments.length, 1);
    assert.equal(attachments[0].contentType, "image/jpeg");
    assert.ok(Buffer.isBuffer(attachments[0].content));
    assert.match(attachments[0].filename, /fenster|\.jpg/i);
  });

  it("allows up to 20 photos; email attaches only first 10", () => {
    assert.equal(MAX_PHOTOS, 20);
    assert.equal(MAX_EMAIL_PHOTO_ATTACHMENTS, 10);
    assert.match(photoLimitHelperTextDe(), /20/);
    assert.match(photoLimitHelperTextDe(), /verkleinert/i);
    const many = Array.from({ length: 15 }, (_, i) =>
      samplePhoto({ name: `f-${i}.jpg` })
    );
    assert.equal(validatePhotos(many), null);
    assert.equal(photosToResendAttachments(many).length, 10);
    assert.equal(normalizePhotoPayloads(many.concat(samplePhoto())).length, 16);
  });

  it("rejects empty / invalid payloads", () => {
    assert.equal(normalizePhotoPayloads(null).length, 0);
    assert.equal(normalizePhotoPayloads([{ name: "x" }]).length, 0);
    assert.ok(validatePhotos([samplePhoto({ type: "application/pdf" })]));
  });
});

describe("photo wiring – contact + admin + sales", () => {
  it("persists photos and exposes them in admin GET", () => {
    const contact = readFileSync(join(process.cwd(), "app/api/contact/route.ts"), "utf8");
    const admin = readFileSync(join(process.cwd(), "app/api/admin/leads/[id]/route.ts"), "utf8");
    const sales = readFileSync(join(process.cwd(), "lib/assistant/sales/submit-lead.ts"), "utf8");
    const panel = readFileSync(
      join(process.cwd(), "components/admin/AdminLeadDetailPanel.tsx"),
      "utf8"
    );

    assert.match(contact, /saveLeadPhotos/);
    assert.match(sales, /saveLeadPhotos/);
    assert.match(admin, /getLeadPhotos/);
    assert.match(admin, /deleteLeadPhotos/);
    assert.match(panel, /admin-lead-photos/);
    assert.match(panel, /admin-lead-photo-/);
  });
});
