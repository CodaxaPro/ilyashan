export type ProductionCheckStatus = "ok" | "warn" | "error";

export interface ProductionCheckItem {
  id: string;
  label: string;
  status: ProductionCheckStatus;
  detail: string;
}

function hasEnv(name: string): boolean {
  const value = process.env[name]?.trim();
  return Boolean(value && !value.includes("HIER_IHREN"));
}

export function runProductionChecks(): ProductionCheckItem[] {
  const checks: ProductionCheckItem[] = [];

  checks.push({
    id: "resend",
    label: "E-Mail (Resend)",
    status: hasEnv("RESEND_API_KEY") ? "ok" : "error",
    detail: hasEnv("RESEND_API_KEY")
      ? "RESEND_API_KEY gesetzt"
      : "RESEND_API_KEY fehlt – Formulare können keine E-Mails senden",
  });

  checks.push({
    id: "contact_email",
    label: "Empfänger E-Mail",
    status: hasEnv("CONTACT_EMAIL") ? "ok" : "warn",
    detail: hasEnv("CONTACT_EMAIL")
      ? `CONTACT_EMAIL=${process.env.CONTACT_EMAIL}`
      : "CONTACT_EMAIL fehlt – Fallback siteConfig.contact.email",
  });

  checks.push({
    id: "from_email",
    label: "Absender E-Mail",
    status: hasEnv("FROM_EMAIL") ? "ok" : "warn",
    detail: hasEnv("FROM_EMAIL")
      ? "FROM_EMAIL gesetzt"
      : "FROM_EMAIL fehlt – Standard-Absender wird verwendet",
  });

  checks.push({
    id: "admin_password",
    label: "Admin-Zugang",
    status: hasEnv("ADMIN_PASSWORD") ? "ok" : "error",
    detail: hasEnv("ADMIN_PASSWORD")
      ? "ADMIN_PASSWORD gesetzt"
      : "ADMIN_PASSWORD fehlt – /admin nicht nutzbar",
  });

  const kvReady = hasEnv("KV_REST_API_URL") && hasEnv("KV_REST_API_TOKEN");
  checks.push({
    id: "kv",
    label: "Lead- & Fragen-Speicher (KV)",
    status: kvReady ? "ok" : "warn",
    detail: kvReady
      ? "Upstash Redis / KV verbunden"
      : "KV_REST_API_URL/TOKEN fehlt – Admin-Listen bleiben leer",
  });

  const adsReady =
    hasEnv("NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO") ||
    hasEnv("NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_LABEL");
  checks.push({
    id: "google_ads",
    label: "Google Ads Conversion",
    status: adsReady ? "ok" : "warn",
    detail: adsReady
      ? "Conversion send_to konfiguriert"
      : "NEXT_PUBLIC_GOOGLE_ADS_REQUEST_QUOTE_SEND_TO fehlt – Events ohne send_to",
  });

  return checks;
}

export function isProductionReady(): boolean {
  return runProductionChecks().every((item) => item.status !== "error");
}

export function productionReadinessScore(): number {
  const checks = runProductionChecks();
  const points = checks.reduce((sum, item) => {
    if (item.status === "ok") return sum + 2;
    if (item.status === "warn") return sum + 1;
    return sum;
  }, 0);
  return Math.round((points / (checks.length * 2)) * 100);
}
