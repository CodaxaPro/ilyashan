export interface ConciergeSettings {
  enabled: boolean;
  updatedAt?: string;
}

const SETTINGS_KEY = "ilyashan:settings:concierge";

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function readEnvOverride(): boolean | null {
  const raw = process.env.CONCIERGE_ENABLED?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

export function isConciergeSettingsStoreConfigured(): boolean {
  return isKvConfigured();
}

export async function getConciergeEnabled(): Promise<boolean> {
  const envOverride = readEnvOverride();
  if (envOverride !== null) return envOverride;

  if (!isKvConfigured()) return false;

  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<ConciergeSettings>(SETTINGS_KEY);
    return stored?.enabled === true;
  } catch (error) {
    console.error("[concierge-settings] get failed:", error);
    return false;
  }
}

export async function setConciergeEnabled(enabled: boolean): Promise<boolean> {
  if (!isKvConfigured()) return false;

  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(SETTINGS_KEY, {
      enabled,
      updatedAt: new Date().toISOString(),
    } satisfies ConciergeSettings);
    return true;
  } catch (error) {
    console.error("[concierge-settings] set failed:", error);
    return false;
  }
}

export type ConciergeSettingsSource = "env" | "kv" | "default";

export async function getConciergeSettings(): Promise<{
  enabled: boolean;
  source: ConciergeSettingsSource;
  storageConfigured: boolean;
  updatedAt?: string;
}> {
  const envOverride = readEnvOverride();
  if (envOverride !== null) {
    return {
      enabled: envOverride,
      source: "env",
      storageConfigured: isKvConfigured(),
    };
  }

  if (!isKvConfigured()) {
    return { enabled: false, source: "default", storageConfigured: false };
  }

  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<ConciergeSettings>(SETTINGS_KEY);
    return {
      enabled: stored?.enabled === true,
      source: "kv",
      storageConfigured: true,
      updatedAt: stored?.updatedAt,
    };
  } catch (error) {
    console.error("[concierge-settings] read failed:", error);
    return { enabled: false, source: "default", storageConfigured: true };
  }
}
