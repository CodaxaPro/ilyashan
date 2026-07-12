import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAppointmentReminderEmail,
  buildAppointmentUpdateEmail,
  buildLeadRejectionEmail,
  getCustomerEmailPreviewDe,
} from "./appointment-email";
import { initialQuoteFormData } from "./quote-form";

const quote = {
  ...initialQuoteFormData,
  services: ["privat"],
  windowCount: 12,
  firstName: "Anna",
  lastName: "Schmidt",
  postalCode: "52499",
  city: "Baesweiler",
};

describe("appointment emails", () => {
  it("builds update email with previous and new date", () => {
    const email = buildAppointmentUpdateEmail(
      quote,
      "ANG-2026-123",
      "2026-03-15",
      "2026-03-08",
      "Bitte klingeln",
      undefined,
      { plannedStartTime: "09:30", estimatedDurationHours: 2.5 }
    );
    assert.match(email.subject, /Terminänderung/i);
    assert.match(email.text, /Bisher: 08\.03\.2026/);
    assert.match(email.text, /Datum: 15\.03\.2026/);
    assert.match(email.text, /Ankunft: gegen 09:30 Uhr/);
    assert.match(email.text, /Bitte klingeln/);
  });

  it("builds rejection email with note", () => {
    const email = buildLeadRejectionEmail(quote, "ANG-2026-123", "Kapazität voll");
    assert.match(email.subject, /Rückmeldung/i);
    assert.match(email.text, /Kapazität voll/);
  });

  it("builds reminder email for tomorrow appointment", () => {
    const email = buildAppointmentReminderEmail(
      quote,
      "ANG-2026-123",
      "2026-07-13",
      undefined,
      { plannedStartTime: "09:30", estimatedDurationHours: 2.5 }
    );
    assert.match(email.subject, /Erinnerung/i);
    assert.match(email.subject, /morgen/i);
    assert.match(email.text, /Morgen \(13\.07\.2026\)/);
    assert.match(email.text, /Ankunft: gegen 09:30 Uhr/);
  });

  it("previews customer email content in German", () => {
    const preview = getCustomerEmailPreviewDe("update", {
      confirmedDate: "2026-03-15",
      previousConfirmedDate: "2026-03-08",
      note: "Neuer Termin",
    });
    assert.match(preview, /Terminänderung/i);
    assert.match(preview, /08\.03\.2026/);
    assert.match(preview, /15\.03\.2026/);
  });
});
