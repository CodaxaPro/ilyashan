/**
 * P2 — Wartung renew outbound: find contracts near horizon end and build renew mail.
 */
import { siteConfig } from "@/lib/config";
import {
  generateWartungSeriesDates,
  intervalDaysForPackage,
} from "@/lib/calendar/wartung-series";
import type { StoredLead } from "@/lib/leads-store";
import type { WartungPackageId } from "@/lib/wartung-packages";
import { berlinIsoDate } from "@/lib/scheduling/berlin-date";
import { addDaysIso } from "@/lib/calendar/week-range";

export interface WartungRenewEmail {
  sentAt: string;
  forHorizonEnd: string;
}

export interface WartungRenewCandidate {
  lead: StoredLead;
  packageId: WartungPackageId;
  horizonEnd: string;
  lastSeriesDate: string;
}

const LOOKAHEAD_DAYS = 21;

export function isWartungLead(lead: StoredLead): boolean {
  const services = lead.quote?.services;
  return Array.isArray(services) && services.includes("wartung");
}

export function resolveWartungPackageId(lead: StoredLead): WartungPackageId | null {
  const id = lead.quote?.wartungPackageId;
  if (
    id === "weekly" ||
    id === "biweekly" ||
    id === "four_weekly" ||
    id === "six_weekly" ||
    id === "quarterly" ||
    id === "biannual"
  ) {
    return id;
  }
  return null;
}

/**
 * Horizon end ≈ last generated series date after confirmed anchor.
 * Renew window: today within LOOKAHEAD_DAYS before that end, and not yet mailed for that end.
 */
export function findWartungRenewCandidates(
  leads: StoredLead[],
  todayIso = berlinIsoDate()
): WartungRenewCandidate[] {
  const windowEnd = addDaysIso(todayIso, LOOKAHEAD_DAYS);
  const out: WartungRenewCandidate[] = [];

  for (const lead of leads) {
    if (!isWartungLead(lead)) continue;
    if (lead.status === "abgelehnt") continue;
    const packageId = resolveWartungPackageId(lead);
    const anchor = lead.appointment?.confirmedDate;
    if (!packageId || !anchor) continue;

    const series = generateWartungSeriesDates({
      anchorDate: anchor,
      packageId,
      preferredWeekday: lead.quote?.wartungPreferredWeekday || undefined,
    });
    if (series.length === 0) {
      // Single-visit horizon: renew ~ interval before next theoretical visit
      const next = addDaysIso(anchor, intervalDaysForPackage(packageId) * 11);
      if (next >= todayIso && next <= windowEnd) {
        if (lead.wartungRenewEmail?.forHorizonEnd === next) continue;
        out.push({ lead, packageId, horizonEnd: next, lastSeriesDate: anchor });
      }
      continue;
    }

    const lastSeriesDate = series[series.length - 1]!;
    if (lastSeriesDate < todayIso || lastSeriesDate > windowEnd) continue;
    if (lead.wartungRenewEmail?.forHorizonEnd === lastSeriesDate) continue;

    out.push({
      lead,
      packageId,
      horizonEnd: lastSeriesDate,
      lastSeriesDate,
    });
  }

  return out;
}

export function buildWartungRenewEmail(input: {
  name: string;
  packageLabel?: string;
  horizonEnd: string;
  anfrageNr?: string;
  renewUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const first = input.name.split(/\s+/)[0] || input.name;
  const subject = `Wartungsvertrag verlängern? — ${siteConfig.name}`;
  const text = [
    `Guten Tag ${first},`,
    "",
    `Ihr Wartungsplan${input.packageLabel ? ` (${input.packageLabel})` : ""} läuft planmäßig bis ca. ${input.horizonEnd}.`,
    "Möchten Sie den Vertrag verlängern — gleiche Intervalle, bekannter Ansprechpartner?",
    "",
    input.renewUrl ? `Online antworten: ${input.renewUrl}` : `Antwort per Telefon: ${siteConfig.contact.phoneDisplay}`,
    "",
    "Wir halten gerne Ihren Platz im Kalender.",
    "",
    `Freundliche Grüße`,
    siteConfig.name,
  ].join("\n");

  const html = `
    <p>Guten Tag ${escapeHtml(first)},</p>
    <p>Ihr Wartungsplan${input.packageLabel ? ` (<strong>${escapeHtml(input.packageLabel)}</strong>)` : ""} läuft planmäßig bis ca. <strong>${escapeHtml(input.horizonEnd)}</strong>.</p>
    <p>Möchten Sie den Vertrag <strong>verlängern</strong> — gleiche Intervalle, bekannter Ansprechpartner?</p>
    ${
      input.renewUrl
        ? `<p><a href="${escapeHtml(input.renewUrl)}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;">Verlängerung anfragen</a></p>`
        : `<p>Telefon: <a href="tel:${siteConfig.contact.phone}">${escapeHtml(siteConfig.contact.phoneDisplay)}</a></p>`
    }
    <p style="color:#64748b;font-size:13px;">Wir halten gerne Ihren Platz im Kalender.</p>
    <p>Freundliche Grüße<br/>${escapeHtml(siteConfig.name)}</p>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
