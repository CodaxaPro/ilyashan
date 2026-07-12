import type { APIRequestContext } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "e2e-playwright-admin";

export interface TerminFixture {
  scenario: string;
  leadId: string;
  anfrageNr: string;
  token: string;
  terminPath: string;
}

export async function seedTerminFixture(
  request: APIRequestContext,
  scenario: "proposed" | "pick_slot" | "already_booked" | "wartung_pick"
): Promise<TerminFixture | null> {
  const res = await request.post("/api/e2e/termin-fixture", {
    headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
    data: { scenario },
  });
  if (res.status() === 503) return null;
  if (!res.ok()) {
    throw new Error(`Fixture ${scenario} failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as TerminFixture;
}

export async function isTerminE2eReady(request: APIRequestContext): Promise<boolean> {
  const res = await request.post("/api/e2e/termin-fixture", {
    headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
    data: { scenario: "pick_slot" },
  });
  if (res.status() === 404) return false;
  if (res.status() === 503) return false;
  return res.ok();
}
