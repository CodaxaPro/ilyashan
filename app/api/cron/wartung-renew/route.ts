import { NextResponse } from "next/server";
import { Resend } from "resend";
import { listLeads, updateLead } from "@/lib/leads-store";
import {
  buildWartungRenewEmail,
  findWartungRenewCandidates,
} from "@/lib/wartung/renew";
import { buildTerminPageUrl } from "@/lib/termin-token";
import { siteConfig } from "@/lib/config";
import { DEFAULT_WARTUNG_PACKAGES } from "@/lib/wartung-packages";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY yapılandırılmamış." }, { status: 503 });
  }

  const leads = await listLeads(200);
  const candidates = findWartungRenewCandidates(leads);
  const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan Fensterreinigung <info@ilyashan.de>";
  const origin = siteConfig.url.replace(/\/de\/?$/, "") || "https://ilyashan.de";

  const results: Array<{ leadId: string; ok: boolean; error?: string }> = [];

  for (const { lead, packageId, horizonEnd } of candidates) {
    if (!lead.email?.trim()) {
      results.push({ leadId: lead.id, ok: false, error: "no_email" });
      continue;
    }
    try {
      const pkg = DEFAULT_WARTUNG_PACKAGES.find((p) => p.id === packageId);
      const renewUrl = buildTerminPageUrl(origin, lead.id);
      const email = buildWartungRenewEmail({
        name: lead.name,
        packageLabel: pkg?.labelDe,
        horizonEnd,
        anfrageNr: lead.anfrageNr,
        renewUrl,
      });
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [lead.email.trim()],
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      if (error) {
        results.push({ leadId: lead.id, ok: false, error: error.message });
        continue;
      }
      await updateLead(lead.id, {
        wartungRenewEmail: { sentAt: new Date().toISOString(), forHorizonEnd: horizonEnd },
      });
      results.push({ leadId: lead.id, ok: true });
    } catch (e) {
      results.push({
        leadId: lead.id,
        ok: false,
        error: e instanceof Error ? e.message : "send_failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent: results.filter((r) => r.ok).length,
    results,
  });
}
