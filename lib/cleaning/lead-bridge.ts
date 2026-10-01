import type { StoredLead } from "@/lib/leads-store";
import { createLeadId } from "@/lib/leads-store";
import type { CleaningQuoteSnapshot } from "@/lib/cleaning/snapshot";
import { formatEuroFromCents } from "@/lib/cleaning/money";

/** Create CRM lead for Büroreinigung — does not invent windowCount. */
export function createCleaningStoredLead(snapshot: CleaningQuoteSnapshot): StoredLead {
  const { contact, input, customer, quoteReference } = snapshot;
  const summary = [
    `Service: Büroreinigung`,
    `Fläche: ${input.totalAreaM2} m²`,
    `Frequenz: ${input.frequency}`,
    `Team: ${customer.recommendedWorkers}`,
    `Dauer: ca. ${customer.estimatedOnsiteHours} Std.`,
    `Netto: ${formatEuroFromCents(customer.netCents)}`,
    `Brutto: ${formatEuroFromCents(customer.grossCents)}`,
    `Status: ${customer.quoteStatus}`,
    contact.street ? `Straße: ${contact.street}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: createLeadId("quote"),
    source: "quote",
    serviceLine: "buero",
    createdAt: snapshot.capturedAt,
    name: contact.contactPerson || contact.company,
    phone: contact.phone,
    email: contact.email,
    anfrageNr: quoteReference,
    status: "neu",
    summary,
    photoCount: 0,
    cleaningSnapshot: snapshot,
    /** Contact/location only — never set windowCount for buero */
    quote: {
      firstName: contact.contactPerson.split(" ")[0] ?? contact.contactPerson,
      lastName: contact.contactPerson.split(" ").slice(1).join(" ") || contact.company,
      email: contact.email,
      phone: contact.phone,
      postalCode: contact.postalCode,
      city: contact.city,
      street: contact.street,
      privacyAccepted: contact.privacyNoticeAccepted,
    },
  };
}
