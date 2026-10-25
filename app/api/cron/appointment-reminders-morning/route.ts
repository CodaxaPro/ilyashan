/**
 * Same-day morning reminder wave (show-rate) — reuses eve cron with wave=morning.
 */
import { GET as runReminders } from "../appointment-reminders/route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("wave", "morning");
  const proxied = new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
  });
  return runReminders(proxied);
}
