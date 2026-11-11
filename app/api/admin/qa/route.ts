import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { sampleQaFlags } from "@/lib/csat/policy";
import { listLeads, isLeadsStoreConfigured } from "@/lib/leads-store";

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin nicht konfiguriert." }, { status: 503 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  return null;
}

/** P2 — QA sampling: flagged leads for human review. */
export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!isLeadsStoreConfigured()) {
    return NextResponse.json({ configured: false, items: [] });
  }

  const leads = await listLeads(200);
  const items = leads
    .map((lead) => {
      const flags = sampleQaFlags(lead);
      if (flags.length === 0) return null;
      return {
        id: lead.id,
        name: lead.name,
        status: lead.status ?? "neu",
        flags,
        csatScore: lead.csat?.score ?? null,
        depositStatus: lead.deposit?.status ?? null,
        photoCount: lead.photoCount,
        createdAt: lead.createdAt,
      };
    })
    .filter(Boolean);

  const csatScores: number[] = [];
  for (const l of leads) {
    if (l.csat?.score) csatScores.push(l.csat.score);
  }
  const avgCsat =
    csatScores.length > 0
      ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10
      : null;

  return NextResponse.json({
    configured: true,
    avgCsat,
    csatCount: csatScores.length,
    flagged: items.length,
    items,
  });
}
