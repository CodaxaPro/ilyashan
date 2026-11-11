import { expect, test } from "@playwright/test";

test.describe("P2 ops surfaces", () => {
  test("CSAT feedback page rejects invalid token", async ({ page }) => {
    await page.goto("/feedback?token=invalid.token");
    await expect(page.getByText(/ungültig|abgelaufen|Fehler/i)).toBeVisible({ timeout: 8000 });
  });

  test("Voice inbound readiness JSON", async ({ request }) => {
    const res = await request.get("/api/voice/inbound");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("ready");
    expect(body).toHaveProperty("hintDe");
    expect(typeof body.ready).toBe("boolean");
  });

  test("Voice inbound without auth → 401/503", async ({ request }) => {
    const res = await request.post("/api/voice/inbound", {
      data: { fromPhone: "01733828354", outcome: "missed" },
    });
    expect([401, 503]).toContain(res.status());
  });
});
