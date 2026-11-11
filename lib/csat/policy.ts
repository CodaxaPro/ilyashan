/**
 * P2 — CSAT after job completion + light QA sampling helpers.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/lib/config";
import type { StoredLead } from "@/lib/leads-store";

export type CsatScore = 1 | 2 | 3 | 4 | 5;

export interface LeadCsat {
  score: CsatScore;
  comment?: string;
  submittedAt: string;
  channel: "email_link" | "portal";
}

export interface CsatInvite {
  sentAt: string;
  forStatus: "abgeschlossen";
}

function getCsatSecret(): string | null {
  const dedicated = process.env.CSAT_TOKEN_SECRET?.trim();
  if (dedicated) return dedicated;
  const termin = process.env.TERMIN_TOKEN_SECRET?.trim();
  if (termin) return termin;
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isCsatTokenConfigured(): boolean {
  return Boolean(getCsatSecret());
}

export function createCsatToken(leadId: string): string | null {
  const secret = getCsatSecret();
  if (!secret) return null;
  const exp = Date.now() + 21 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ leadId, exp }), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyCsatToken(token: string | undefined | null): { leadId: string } | null {
  if (!token) return null;
  const secret = getCsatSecret();
  if (!secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      leadId?: string;
      exp?: number;
    };
    if (!parsed.leadId || typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
    return { leadId: parsed.leadId };
  } catch {
    return null;
  }
}

export function buildCsatPageUrl(baseUrl: string, leadId: string): string | null {
  const token = createCsatToken(leadId);
  if (!token) return null;
  const url = new URL("/feedback", baseUrl.replace(/\/$/, ""));
  url.searchParams.set("token", token);
  return url.toString();
}

export function shouldSendCsatInvite(
  lead: Pick<StoredLead, "status" | "csat" | "csatInvite" | "email">,
  previousStatus?: string
): boolean {
  if (lead.status !== "abgeschlossen") return false;
  if (previousStatus === "abgeschlossen") return false;
  if (lead.csat) return false;
  if (lead.csatInvite) return false;
  if (!lead.email?.trim()) return false;
  return isCsatTokenConfigured();
}

export function buildCsatInviteEmail(input: {
  name: string;
  feedbackUrl: string;
  anfrageNr?: string;
}): { subject: string; text: string; html: string } {
  const first = input.name.split(/\s+/)[0] || input.name;
  const subject = `Wie war unser Einsatz? — ${siteConfig.name}`;
  const text = [
    `Guten Tag ${first},`,
    "",
    "vielen Dank, dass wir für Sie da sein durften.",
    "Wie zufrieden waren Sie mit dem Einsatz? (1–5 Sterne)",
    "",
    input.feedbackUrl,
    "",
    `Freundliche Grüße`,
    siteConfig.name,
  ].join("\n");
  const html = `
    <p>Guten Tag ${escapeHtml(first)},</p>
    <p>vielen Dank, dass wir für Sie da sein durften.</p>
    <p>Wie zufrieden waren Sie mit dem Einsatz?</p>
    <p><a href="${escapeHtml(input.feedbackUrl)}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;">Bewertung abgeben</a></p>
    <p style="color:#64748b;font-size:12px;">${input.anfrageNr ? `Anfrage ${escapeHtml(input.anfrageNr)} · ` : ""}${escapeHtml(siteConfig.name)}</p>
  `.trim();
  return { subject, text, html };
}

export function parseCsatScore(raw: unknown): CsatScore | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

/** QA sampling: flag leads that need human review. */
export function sampleQaFlags(lead: StoredLead): string[] {
  const flags: string[] = [];
  if (lead.csat && lead.csat.score <= 2) flags.push("low_csat");
  if (lead.photoCount === 0 && lead.session?.assistantProduct) {
    const p = lead.session.assistantProduct;
    if (p === "bauend" || p === "renovierung" || p === "entruempelung") {
      flags.push("missing_photos");
    }
  }
  if (lead.deposit?.status === "requested") flags.push("deposit_open");
  if (lead.hot && lead.status === "neu") flags.push("hot_unworked");
  return flags;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
