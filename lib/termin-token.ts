import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_DAYS = 30;

function getTerminSecret(): string | null {
  const dedicated = process.env.TERMIN_TOKEN_SECRET?.trim();
  if (dedicated) return dedicated;
  const admin = process.env.ADMIN_PASSWORD?.trim();
  return admin || null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export interface TerminTokenPayload {
  leadId: string;
  exp: number;
}

export function isTerminTokenConfigured(): boolean {
  return Boolean(getTerminSecret());
}

export function createTerminToken(leadId: string): string | null {
  const secret = getTerminSecret();
  if (!secret) return null;
  const exp = Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ leadId, exp } satisfies TerminTokenPayload), "utf8").toString(
    "base64url"
  );
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyTerminToken(token: string | undefined | null): TerminTokenPayload | null {
  if (!token) return null;
  const secret = getTerminSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TerminTokenPayload;
    if (!parsed.leadId || typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildTerminPageUrl(baseUrl: string, leadId: string): string | null {
  const token = createTerminToken(leadId);
  if (!token) return null;
  const url = new URL("/termin", baseUrl.replace(/\/$/, ""));
  url.searchParams.set("token", token);
  return url.toString();
}
