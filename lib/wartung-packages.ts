export type WartungPackageId =
  | "weekly"
  | "biweekly"
  | "four_weekly"
  | "six_weekly"
  | "quarterly"
  | "biannual";

export type WartungPackageBadge = "popular" | "best_value" | null;

export interface WartungPackage {
  id: WartungPackageId;
  labelDe: string;
  subtitleDe: string;
  visitsPerYear: number;
  /** 0–0.5 fraction */
  discountPercent: number;
  minMonthly: number;
  visiblePrivat: boolean;
  visibleGewerbe: boolean;
  enabled: boolean;
  badge: WartungPackageBadge;
  sortOrder: number;
}

export const WARTUNG_PACKAGE_IDS: WartungPackageId[] = [
  "weekly",
  "biweekly",
  "four_weekly",
  "six_weekly",
  "quarterly",
  "biannual",
];

export const DEFAULT_WARTUNG_PACKAGES: WartungPackage[] = [
  {
    id: "weekly",
    labelDe: "Wöchentlich",
    subtitleDe: "52× pro Jahr · höchster Rabatt",
    visitsPerYear: 52,
    discountPercent: 0.32,
    minMonthly: 89,
    visiblePrivat: false,
    visibleGewerbe: true,
    enabled: true,
    badge: null,
    sortOrder: 1,
  },
  {
    id: "biweekly",
    labelDe: "2-wöchentlich",
    subtitleDe: "26× pro Jahr",
    visitsPerYear: 26,
    discountPercent: 0.28,
    minMonthly: 79,
    visiblePrivat: false,
    visibleGewerbe: true,
    enabled: true,
    badge: null,
    sortOrder: 2,
  },
  {
    id: "four_weekly",
    labelDe: "4-wöchentlich",
    subtitleDe: "13× pro Jahr · empfohlen",
    visitsPerYear: 13,
    discountPercent: 0.22,
    minMonthly: 69,
    visiblePrivat: true,
    visibleGewerbe: true,
    enabled: true,
    badge: "popular",
    sortOrder: 3,
  },
  {
    id: "six_weekly",
    labelDe: "6-wöchentlich",
    subtitleDe: "≈9× pro Jahr",
    visitsPerYear: 9,
    discountPercent: 0.17,
    minMonthly: 62,
    visiblePrivat: true,
    visibleGewerbe: true,
    enabled: true,
    badge: null,
    sortOrder: 4,
  },
  {
    id: "quarterly",
    labelDe: "Vierteljährlich",
    subtitleDe: "4× pro Jahr · günstigster Monatspreis",
    visitsPerYear: 4,
    discountPercent: 0.12,
    minMonthly: 59,
    visiblePrivat: true,
    visibleGewerbe: true,
    enabled: true,
    badge: "best_value",
    sortOrder: 5,
  },
  {
    id: "biannual",
    labelDe: "Halbjährlich",
    subtitleDe: "2× pro Jahr",
    visitsPerYear: 2,
    discountPercent: 0.05,
    minMonthly: 49,
    visiblePrivat: true,
    visibleGewerbe: true,
    enabled: true,
    badge: null,
    sortOrder: 6,
  },
];

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeBadge(raw: unknown): WartungPackageBadge {
  if (raw === "popular" || raw === "best_value") return raw;
  return null;
}

function sanitizePackageId(raw: unknown): WartungPackageId | null {
  if (typeof raw === "string" && WARTUNG_PACKAGE_IDS.includes(raw as WartungPackageId)) {
    return raw as WartungPackageId;
  }
  return null;
}

export function sanitizeWartungPackage(
  raw: Partial<WartungPackage> | null | undefined,
  fallback: WartungPackage
): WartungPackage {
  const id = sanitizePackageId(raw?.id) ?? fallback.id;
  return {
    id,
    labelDe: typeof raw?.labelDe === "string" && raw.labelDe.trim() ? raw.labelDe.trim() : fallback.labelDe,
    subtitleDe:
      typeof raw?.subtitleDe === "string" && raw.subtitleDe.trim()
        ? raw.subtitleDe.trim()
        : fallback.subtitleDe,
    visitsPerYear: clampNumber(raw?.visitsPerYear, 1, 52, fallback.visitsPerYear),
    discountPercent: clampNumber(raw?.discountPercent, 0, 0.5, fallback.discountPercent),
    minMonthly: clampNumber(raw?.minMonthly, 20, 500, fallback.minMonthly),
    visiblePrivat:
      typeof raw?.visiblePrivat === "boolean" ? raw.visiblePrivat : fallback.visiblePrivat,
    visibleGewerbe:
      typeof raw?.visibleGewerbe === "boolean" ? raw.visibleGewerbe : fallback.visibleGewerbe,
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : fallback.enabled,
    badge: sanitizeBadge(raw?.badge ?? fallback.badge),
    sortOrder: clampNumber(raw?.sortOrder, 1, 99, fallback.sortOrder),
  };
}

export function sanitizeWartungPackages(
  raw: Partial<WartungPackage>[] | null | undefined
): WartungPackage[] {
  const defaults = DEFAULT_WARTUNG_PACKAGES;
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaults.map((pkg) => ({ ...pkg }));
  }

  const byId = new Map<WartungPackageId, WartungPackage>();
  for (const fallback of defaults) {
    const incoming = raw.find((item) => item.id === fallback.id);
    byId.set(fallback.id, sanitizeWartungPackage(incoming, fallback));
  }

  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getWartungPackageById(
  packages: WartungPackage[],
  id: WartungPackageId | "" | undefined
): WartungPackage | null {
  if (!id) return null;
  return packages.find((pkg) => pkg.id === id && pkg.enabled) ?? null;
}

export type WartungAudience = "privat" | "gewerbe";

export function getWartungAudience(services: string[]): WartungAudience {
  return services.includes("gewerbe") ? "gewerbe" : "privat";
}

export function filterWartungPackagesForAudience(
  packages: WartungPackage[],
  audience: WartungAudience
): WartungPackage[] {
  return packages
    .filter((pkg) => pkg.enabled)
    .filter((pkg) => (audience === "gewerbe" ? pkg.visibleGewerbe : pkg.visiblePrivat))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDefaultWartungPackageId(
  packages: WartungPackage[],
  audience: WartungAudience
): WartungPackageId | "" {
  const available = filterWartungPackagesForAudience(packages, audience);
  const popular = available.find((pkg) => pkg.badge === "popular");
  if (popular) return popular.id;
  return available[0]?.id ?? "";
}

export function formatWartungBadgeDe(badge: WartungPackageBadge): string | null {
  if (badge === "popular") return "Beliebt";
  if (badge === "best_value") return "Bester Monatspreis";
  return null;
}
