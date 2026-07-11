import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

function loadDotEnvFile(filename: string) {
  try {
    const raw = readFileSync(resolve(__dirname, filename), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional local env
  }
}

loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const E2E_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "e2e-playwright-admin";
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = E2E_ADMIN_PASSWORD;

const WEB_SERVER_ENV_KEYS = [
  "ADMIN_PASSWORD",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CONTACT_EMAIL",
  "FROM_EMAIL",
] as const;

function webServerEnv(): Record<string, string> {
  const env: Record<string, string> = {
    CONCIERGE_ENABLED: "true",
    ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
  };
  for (const key of WEB_SERVER_ENV_KEYS) {
    if (process.env[key]) env[key] = process.env[key]!;
  }
  return env;
}

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/de/angebot`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: webServerEnv(),
  },
});
