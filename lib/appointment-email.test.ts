import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAppointmentConfirmationEmail,
  buildAppointmentProposalEmail,
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
  it("builds confirmation email with Festpreis inkl. MwSt. for privat", () => {
    const email = buildAppointmentConfirmationEmail(
      quote,
      "ANG-2026-836209",
      "2026-09-01",
      undefined,
      undefined,
      { plannedStartTime: "11:00", estimatedDurationHours: 2 },
      125
    );
    assert.match(email.subject, /Terminbestätigung/i);
    assert.match(email.text, /Ihr Festpreis: 125\s*€ inkl\. MwSt/);
    assert.match(email.html, /inkl\. MwSt/);
  });

  it("builds confirmation email with Netto/MwSt/Brutto for gewerbe", () => {
    const gewerbeQuote = { ...quote, services: ["gewerbe" as const], objectType: "gewerbe" as const };
    const email = buildAppointmentConfirmationEmail(
      gewerbeQuote,
      "ANG-2026-836210",
      "2026-09-01",
      undefined,
      undefined,
      { plannedStartTime: "11:00", estimatedDurationHours: 2 },
      125
    );
    assert.match(email.text, /Netto/);
    assert.match(email.text, /zzgl\. 19 % MwSt/);
    assert.match(email.text, /Brutto 125\s*€/);
  });

  it("builds update email with previous date and Festpreis", () => {
    const email = buildAppointmentUpdateEmail(
      quote,
      "ANG-2026-123",
      "2026-03-15",
      "2026-03-08",
      "Bitte klingeln",
      undefined,
      { plannedStartTime: "09:30", estimatedDurationHours: 2.5 },
      130
    );
    assert.match(email.subject, /Terminänderung/i);
    assert.match(email.text, /Bisher: 08\.03\.2026/);
    assert.match(email.text, /Datum: 15\.03\.2026/);
    assert.match(email.text, /Ankunft: gegen 09:30 Uhr/);
    assert.match(email.text, /Bitte klingeln/);
    assert.match(email.text, /Ihr Festpreis: 130\s*€ inkl\. MwSt/);
  });

  it("builds rejection email with note and without Festpreis", () => {
    const email = buildLeadRejectionEmail(quote, "ANG-2026-123", "Kapazität voll");
    assert.match(email.subject, /Rückmeldung/i);
    assert.match(email.text, /Kapazität voll/);
    assert.doesNotMatch(email.text, /Festpreis/);
  });

  it("builds reminder email with Festpreis when set", () => {
    const email = buildAppointmentReminderEmail(
      quote,
      "ANG-2026-123",
      "2026-07-13",
      undefined,
      { plannedStartTime: "09:30", estimatedDurationHours: 2.5 },
      125
    );
    assert.match(email.subject, /Erinnerung/i);
    assert.match(email.subject, /morgen/i);
    assert.match(email.text, /Morgen \(13\.07\.2026\)/);
    assert.match(email.text, /Ankunft: gegen 09:30 Uhr/);
    assert.match(email.text, /inkl\. MwSt/);
  });

  it("builds proposal email with Festpreis", () => {
    const email = buildAppointmentProposalEmail(
      quote,
      "ANG-2026-123",
      "2026-09-03",
      undefined,
      undefined,
      null,
      { plannedStartTime: "10:00", estimatedDurationHours: 2 },
      125
    );
    assert.match(email.subject, /Terminvorschlag/i);
    assert.match(email.text, /Festpreis: 125\s*€ inkl\. MwSt/);
  });

  it("previews customer email content in German including Festpreis", () => {
    const preview = getCustomerEmailPreviewDe("confirm", {
      confirmedDate: "2026-03-15",
      festpreis: 125,
      audience: "privat",
      appointment: { plannedStartTime: "11:00", estimatedDurationHours: 2 },
    });
    assert.match(preview, /Terminbestätigung/i);
    assert.match(preview, /inkl\. MwSt/);
  });

  it("previews update without requiring Festpreis text when missing", () => {
    const preview = getCustomerEmailPreviewDe("update", {
      confirmedDate: "2026-03-15",
      previousConfirmedDate: "2026-03-08",
      note: "Neuer Termin",
    });
    assert.match(preview, /Terminänderung/i);
    assert.match(preview, /08\.03\.2026/);
    assert.match(preview, /15\.03\.2026/);
    assert.doesNotMatch(preview, /Festpreis/);
  });
});
