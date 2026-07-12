const BERLIN_TZ = "Europe/Berlin";

/** ISO date (YYYY-MM-DD) in Europe/Berlin for the given instant. */
export function berlinIsoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BERLIN_TZ }).format(now);
}

export function addDaysToIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

export function berlinTomorrowIso(now: Date = new Date()): string {
  return addDaysToIsoDate(berlinIsoDate(now), 1);
}
