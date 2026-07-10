import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "ilyashan-admin-session";
const SESSION_HOURS = 24;

function getAdminSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminSecret());
}

export function createAdminSessionToken(): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;

  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getAdminSecret();
  if (!secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = signPayload(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
