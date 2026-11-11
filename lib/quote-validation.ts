import type { QuoteFormData, QuoteServiceId } from "@/lib/quote-form";

export type QuoteValidationIssue = {
  field: string;
  message: string;
};

export function hasPrimaryService(services: QuoteServiceId[]) {
  return services.includes("privat") || services.includes("gewerbe");
}

/** Primary service for CRM labels – defaults to privat (same live price). */
export function ensurePrimaryService(services: QuoteServiceId[]): "privat" | "gewerbe" {
  return services.includes("gewerbe") ? "gewerbe" : "privat";
}

/** Schritt 1: immer eine Hauptleistung (Privat-Default); Wartung optional */
export function normalizeServices(services: QuoteServiceId[]): QuoteServiceId[] {
  const wartung = services.includes("wartung");
  const primary = ensurePrimaryService(services);
  return wartung ? [primary, "wartung"] : [primary];
}

/** Objektart steuert CRM-Label (Gewerbe); Preis bleibt Privat-Live. */
export function syncServicesWithObjectType(
  services: QuoteServiceId[],
  objectType: QuoteFormData["objectType"]
): QuoteServiceId[] {
  const wartung = services.includes("wartung");
  const primary = objectType === "gewerbe" ? "gewerbe" : "privat";
  return wartung ? [primary, "wartung"] : [primary];
}

export function validateQuoteStep(step: number, data: QuoteFormData): QuoteValidationIssue[] {
  const issues: QuoteValidationIssue[] = [];

  if (step >= 1) {
    if (!hasPrimaryService(normalizeServices(data.services))) {
      issues.push({
        field: "services",
        message: "Leistung konnte nicht geladen werden. Bitte Seite neu laden.",
      });
    }
    if (
      data.services.includes("privat") &&
      data.services.includes("gewerbe")
    ) {
      issues.push({
        field: "services",
        message: "Privat und Gewerbe können nicht gleichzeitig gewählt werden.",
      });
    }
    if (data.services.includes("wartung")) {
      if (!data.wartungPackageId) {
        issues.push({
          field: "wartungPackageId",
          message: "Bitte wählen Sie ein Wartungs-Intervall.",
        });
      }
      if (!data.wartungPreferredWeekday) {
        issues.push({
          field: "wartungPreferredWeekday",
          message: "Bitte bevorzugten Wochentag wählen.",
        });
      }
      if (!data.wartungPreferredTimeSlot) {
        issues.push({
          field: "wartungPreferredTimeSlot",
          message: "Bitte Zeitfenster wählen.",
        });
      }
    }
  }

  if (step >= 2) {
    if (!data.objectType) {
      issues.push({ field: "objectType", message: "Objektart fehlt." });
    }
    if (data.objectType === "sonstiges" && !data.objectTypeOther.trim()) {
      issues.push({ field: "objectTypeOther", message: "Bitte Objektart beschreiben." });
    }
    if (!data.floorLevel) {
      issues.push({ field: "floorLevel", message: "Etage fehlt." });
    }
    if (!data.elevator) {
      issues.push({ field: "elevator", message: "Aufzug-Angabe fehlt." });
    }
  }

  if (step >= 3) {
    if (data.windowCount < 1 || data.windowCount > 80) {
      issues.push({ field: "windowCount", message: "Ungültige Fensterflügel-Anzahl." });
    }
    if (data.includeSolar && data.solarSqm < 5) {
      issues.push({ field: "solarSqm", message: "Solar: mindestens 5 m² angeben." });
    }
    if (data.includeWintergarden && data.wintergardenSqm < 5) {
      issues.push({
        field: "wintergardenSqm",
        message: "Wintergarten: mindestens 5 m² angeben.",
      });
    }
  }

  if (step >= 4) {
    if (!data.scheduleOption) {
      issues.push({ field: "scheduleOption", message: "Terminwunsch fehlt." });
    }
    if (data.scheduleOption === "wunschtermine" && data.preferredDates.length === 0) {
      issues.push({ field: "preferredDates", message: "Mindestens ein Wunschtermin wählen." });
    }
  }

  if (step >= 5) {
    if (!data.firstName.trim()) issues.push({ field: "firstName", message: "Vorname fehlt." });
    if (!data.lastName.trim()) issues.push({ field: "lastName", message: "Nachname fehlt." });
    if (!data.phone.trim()) issues.push({ field: "phone", message: "Telefon fehlt." });
    if (!data.postalCode.trim()) issues.push({ field: "postalCode", message: "PLZ fehlt." });
    if (!data.city.trim()) issues.push({ field: "city", message: "Stadt fehlt." });
    if (!data.privacyAccepted) {
      issues.push({ field: "privacyAccepted", message: "Datenschutz-Zustimmung fehlt." });
    }
  }

  return issues;
}

export function canProceedQuoteStep(step: number, data: QuoteFormData) {
  return validateQuoteStep(step, data).length === 0;
}

export function validateQuoteSubmission(data: QuoteFormData): QuoteValidationIssue[] {
  return validateQuoteStep(5, data);
}

export function isQuoteSubmissionValid(data: QuoteFormData) {
  return validateQuoteSubmission(data).length === 0;
}

/** @deprecated Leistung wird nicht mehr in Schritt 1 gewählt – Objektart steuert Label. */
export function syncObjectTypeWithService(
  _services: QuoteServiceId[],
  objectType: QuoteFormData["objectType"]
): QuoteFormData["objectType"] {
  return objectType;
}
