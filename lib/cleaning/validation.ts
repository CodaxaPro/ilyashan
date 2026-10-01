import type { CustomerInput, ValidationLevel } from "./types";
import { areasSynchronized, floorsSynchronized } from "./area-sync";
import { sumSubAreas, sumFloors } from "./types";

export interface ValidationIssue {
  code: string;
  level: ValidationLevel;
  messageDe: string;
  messageTr: string;
  field?: string;
}

export function validateCustomerInput(input: CustomerInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(input.totalAreaM2) || input.totalAreaM2 < 0) {
    issues.push({
      code: "TOTAL_AREA_INVALID",
      level: "BLOCKING_ERROR",
      messageDe: "Gesamte Reinigungsfläche ist ungültig.",
      messageTr: "Toplam temizlenecek alan geçersiz.",
      field: "totalAreaM2",
    });
  }

  if (input.totalAreaM2 > 50_000) {
    issues.push({
      code: "TOTAL_AREA_EXTREME",
      level: "WARNING",
      messageDe: "Sehr große Fläche – individuelles Angebot empfohlen.",
      messageTr: "Çok büyük alan – bireysel teklif önerilir.",
      field: "totalAreaM2",
    });
  }

  if (!areasSynchronized(input.totalAreaM2, input.subAreas)) {
    issues.push({
      code: "SUBAREA_MISMATCH",
      level: "BLOCKING_ERROR",
      messageDe: `Teilflächen (${sumSubAreas(input.subAreas).toFixed(1)} m²) ≠ Gesamfläche (${input.totalAreaM2} m²).`,
      messageTr: `Alt alanlar (${sumSubAreas(input.subAreas).toFixed(1)} m²) ≠ toplam (${input.totalAreaM2} m²).`,
      field: "subAreas",
    });
  }

  if (!floorsSynchronized(input.totalAreaM2, input.floors)) {
    issues.push({
      code: "FLOOR_MISMATCH",
      level: "BLOCKING_ERROR",
      messageDe: `Bodenarten (${sumFloors(input.floors).toFixed(1)} m²) ≠ Gesamfläche (${input.totalAreaM2} m²).`,
      messageTr: `Zemin türleri (${sumFloors(input.floors).toFixed(1)} m²) ≠ toplam (${input.totalAreaM2} m²).`,
      field: "floors",
    });
  }

  const density =
    input.totalAreaM2 > 0 ? input.office.workstations / input.totalAreaM2 : 0;
  if (input.office.workstations > 0 && density > 0.5) {
    issues.push({
      code: "DESK_DENSITY_HIGH",
      level: "WARNING",
      messageDe: "Ungewöhnlich viele Arbeitsplätze für die Fläche.",
      messageTr: "Alana göre olağandışı fazla çalışma masası.",
      field: "office.workstations",
    });
  }

  if (input.subAreas.sanitary <= 10 && input.sanitary.toilets >= 30) {
    issues.push({
      code: "SANITARY_DENSITY",
      level: "WARNING",
      messageDe: "Viele Sanitärobjekte bei kleiner Sanitärfläche.",
      messageTr: "Küçük ıslak hacimde çok fazla sanitasyon ünitesi.",
      field: "sanitary",
    });
  }

  if (input.subAreas.kitchen <= 0 && input.kitchen.kitchens > 0) {
    issues.push({
      code: "KITCHEN_AREA_ZERO",
      level: "WARNING",
      messageDe: "Küchenanzahl > 0, aber keine Küchenfläche.",
      messageTr: "Mutfak sayısı > 0 ama mutfak alanı yok.",
      field: "kitchen",
    });
  }

  if (input.office.meetingRooms === 0 && input.office.meetingChairs >= 40) {
    issues.push({
      code: "MEETING_CHAIRS_NO_ROOMS",
      level: "WARNING",
      messageDe: "Viele Meetingstühle ohne Meetingräume.",
      messageTr: "Toplantı odası yokken çok sandalye.",
      field: "office.meetingChairs",
    });
  }

  if (
    input.condition === "INITIAL_INTENSIVE" &&
    input.frequency !== "ONE_TIME" &&
    input.totalAreaM2 >= 500
  ) {
    issues.push({
      code: "INTENSIVE_LARGE",
      level: "INFO",
      messageDe: "Große Erst-/Intensivreinigung – Prüfung empfohlen.",
      messageTr: "Büyük ilk/yoğun temizlik – inceleme önerilir.",
    });
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === "BLOCKING_ERROR");
}

export function requiresManualReview(input: CustomerInput, issues: ValidationIssue[]): boolean {
  if (input.totalAreaM2 >= 2000) return true;
  if (issues.some((i) => i.code === "DESK_DENSITY_HIGH" || i.code === "SANITARY_DENSITY")) {
    return true;
  }
  if (input.condition === "INITIAL_INTENSIVE" && input.totalAreaM2 >= 800) return true;
  return false;
}
