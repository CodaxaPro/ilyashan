import { siteConfig } from "@/lib/config";

export function getCalendarIcsToken(): string | null {
  const token = process.env.CALENDAR_ICS_TOKEN?.trim();
  return token || null;
}

export function isCalendarFeedConfigured(): boolean {
  return Boolean(getCalendarIcsToken());
}

export function verifyCalendarFeedToken(token: string | null | undefined): boolean {
  const expected = getCalendarIcsToken();
  if (!expected || !token) return false;
  return token === expected;
}

export function buildCalendarFeedUrl(baseUrl: string, token: string): string {
  const url = new URL("/api/calendar/feed", baseUrl.replace(/\/$/, ""));
  url.searchParams.set("token", token);
  return url.toString();
}

export function calendarUidHost(): string {
  try {
    return new URL(siteConfig.url).hostname;
  } catch {
    return "ilyashan.de";
  }
}
