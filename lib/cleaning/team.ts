import type { CleaningEngineConfig } from "./seed-config";

export interface TeamRecommendation {
  workers: number;
  teamEfficiency: number;
  onsiteHoursRaw: number;
  onsiteHoursRounded: number;
}

/**
 * Recommend team size without assuming linear N× productivity.
 * onsite = personHours / (workers × teamEfficiency)
 */
export function recommendTeam(
  requiredPersonHours: number,
  config: CleaningEngineConfig
): TeamRecommendation {
  const hours = Math.max(0, requiredPersonHours);
  let best: TeamRecommendation | null = null;

  for (let w = 1; w <= config.maxTeamSize; w++) {
    const eff = config.teamEfficiency[w as 1 | 2 | 3 | 4] ?? w;
    const onsiteHoursRaw = hours <= 0 ? 0 : hours / (w * eff);
    const onsiteHoursRounded = Math.ceil(onsiteHoursRaw * 2) / 2; // 0.5h steps
    const candidate: TeamRecommendation = {
      workers: w,
      teamEfficiency: eff,
      onsiteHoursRaw,
      onsiteHoursRounded,
    };
    if (!best) {
      best = candidate;
      continue;
    }
    const bestDelta = Math.abs(best.onsiteHoursRaw - config.targetOnsiteHours);
    const nextDelta = Math.abs(candidate.onsiteHoursRaw - config.targetOnsiteHours);
    // Prefer closer to target onsite; tie-break fewer workers
    if (nextDelta < bestDelta - 1e-9 || (Math.abs(nextDelta - bestDelta) < 1e-9 && w < best.workers)) {
      best = candidate;
    }
  }

  return best ?? {
    workers: 1,
    teamEfficiency: 1,
    onsiteHoursRaw: hours,
    onsiteHoursRounded: Math.ceil(hours * 2) / 2,
  };
}
