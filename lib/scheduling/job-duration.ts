/** Estimated on-site duration (hours) from window count – used for capacity hints. */
export function estimateJobHours(windowCount: number): number {
  if (windowCount <= 6) return 1.5;
  if (windowCount <= 12) return 2.5;
  if (windowCount <= 20) return 3.5;
  if (windowCount <= 30) return 4.5;
  return 6;
}

export function estimateJobSlots(windowCount: number): 1 | 2 {
  return windowCount > 16 ? 2 : 1;
}
