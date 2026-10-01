import type { FloorAreas, SubAreas } from "./types";
import { emptyFloors, emptySubAreas, sumFloors, sumSubAreas } from "./types";

const SUB_KEYS: (keyof SubAreas)[] = [
  "office",
  "meeting",
  "kitchen",
  "sanitary",
  "corridors",
  "reception",
  "other",
];

const FLOOR_KEYS: (keyof FloorAreas)[] = ["carpet", "hard", "wet", "other"];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * When totalArea changes: proportionally redistribute unlocked parts.
 * Locked parts stay fixed; remainder split among unlocked.
 * If all locked or zero previous sum: put remainder into first unlocked (default office/carpet).
 */
export function redistributeSubAreas(
  totalArea: number,
  current: SubAreas,
  locks: Partial<Record<keyof SubAreas, boolean>> = {}
): SubAreas {
  const total = Math.max(0, totalArea);
  const lockedSum = SUB_KEYS.filter((k) => locks[k]).reduce((s, k) => s + current[k], 0);
  const unlocked = SUB_KEYS.filter((k) => !locks[k]);
  const remainder = Math.max(0, total - lockedSum);

  const next = { ...current };
  for (const k of SUB_KEYS) {
    if (locks[k]) next[k] = current[k];
  }

  if (unlocked.length === 0) {
    return next;
  }

  const unlockedPrev = unlocked.reduce((s, k) => s + current[k], 0);
  if (unlockedPrev <= 0) {
    const fill = emptySubAreas();
    Object.assign(next, fill);
    for (const k of SUB_KEYS) {
      if (locks[k]) next[k] = current[k];
      else next[k] = 0;
    }
    next[unlocked[0]] = round1(remainder);
    return normalizeSum(next, total, unlocked);
  }

  let allocated = 0;
  unlocked.forEach((k, i) => {
    if (i === unlocked.length - 1) {
      next[k] = round1(remainder - allocated);
    } else {
      const share = round1((current[k] / unlockedPrev) * remainder);
      next[k] = share;
      allocated += share;
    }
  });

  return normalizeSum(next, total, unlocked);
}

export function redistributeFloors(
  totalArea: number,
  current: FloorAreas,
  locks: Partial<Record<keyof FloorAreas, boolean>> = {}
): FloorAreas {
  const total = Math.max(0, totalArea);
  const lockedSum = FLOOR_KEYS.filter((k) => locks[k]).reduce((s, k) => s + current[k], 0);
  const unlocked = FLOOR_KEYS.filter((k) => !locks[k]);
  const remainder = Math.max(0, total - lockedSum);

  const next = { ...current };
  for (const k of FLOOR_KEYS) {
    if (locks[k]) next[k] = current[k];
  }

  if (unlocked.length === 0) return next;

  const unlockedPrev = unlocked.reduce((s, k) => s + current[k], 0);
  if (unlockedPrev <= 0) {
    for (const k of FLOOR_KEYS) {
      if (!locks[k]) next[k] = 0;
    }
    next[unlocked[0]] = round1(remainder);
    return normalizeFloorSum(next, total, unlocked);
  }

  let allocated = 0;
  unlocked.forEach((k, i) => {
    if (i === unlocked.length - 1) {
      next[k] = round1(remainder - allocated);
    } else {
      const share = round1((current[k] / unlockedPrev) * remainder);
      next[k] = share;
      allocated += share;
    }
  });

  return normalizeFloorSum(next, total, unlocked);
}

/**
 * Manual edit of one subarea: clamp, then redistribute remainder among other unlocked.
 */
export function setSubArea(
  totalArea: number,
  current: SubAreas,
  key: keyof SubAreas,
  value: number,
  locks: Partial<Record<keyof SubAreas, boolean>> = {}
): SubAreas {
  const total = Math.max(0, totalArea);
  const v = Math.max(0, round1(value));
  const nextLocks = { ...locks, [key]: true };
  const next = { ...current, [key]: Math.min(v, total) };
  return redistributeSubAreas(total, next, nextLocks);
}

export function setFloorArea(
  totalArea: number,
  current: FloorAreas,
  key: keyof FloorAreas,
  value: number,
  locks: Partial<Record<keyof FloorAreas, boolean>> = {}
): FloorAreas {
  const total = Math.max(0, totalArea);
  const v = Math.max(0, round1(value));
  const nextLocks = { ...locks, [key]: true };
  const next = { ...current, [key]: Math.min(v, total) };
  return redistributeFloors(total, next, nextLocks);
}

function normalizeSum(
  areas: SubAreas,
  total: number,
  unlocked: (keyof SubAreas)[]
): SubAreas {
  const drift = round1(total - sumSubAreas(areas));
  if (Math.abs(drift) < 0.05 || unlocked.length === 0) return areas;
  const last = unlocked[unlocked.length - 1];
  return { ...areas, [last]: round1(Math.max(0, areas[last] + drift)) };
}

function normalizeFloorSum(
  floors: FloorAreas,
  total: number,
  unlocked: (keyof FloorAreas)[]
): FloorAreas {
  const drift = round1(total - sumFloors(floors));
  if (Math.abs(drift) < 0.05 || unlocked.length === 0) return floors;
  const last = unlocked[unlocked.length - 1];
  return { ...floors, [last]: round1(Math.max(0, floors[last] + drift)) };
}

export function areasSynchronized(total: number, sub: SubAreas, eps = 0.05): boolean {
  return Math.abs(sumSubAreas(sub) - total) <= eps;
}

export function floorsSynchronized(total: number, floors: FloorAreas, eps = 0.05): boolean {
  return Math.abs(sumFloors(floors) - total) <= eps;
}
