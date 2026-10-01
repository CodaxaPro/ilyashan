import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { getCleaningQuoteByReference } from "@/lib/cleaning/quotes-store";
import { getLead, listLeads } from "@/lib/leads-store";
import { filterBueroLeads } from "@/lib/cleaning/admin-overview";
import { formatEuroFromCents } from "@/lib/cleaning/money";
import { buildTerminPageUrl } from "@/lib/termin-token";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { id } = await context.params;
  const origin = new URL(request.url).origin;

  const lead = await getLead(id);
  if (lead?.cleaningSnapshot) {
    const snap = lead.cleaningSnapshot;
    return NextResponse.json({
      kind: "lead",
      lead,
      terminUrl: buildTerminPageUrl(origin, lead.id),
      customer: snap.customer,
      admin: snap.admin,
      contact: snap.contact,
      input: snap.input,
      quoteReference: snap.quoteReference,
      configVersionId: snap.configVersionId,
      money: {
        net: formatEuroFromCents(snap.customer.netCents),
        vat: formatEuroFromCents(snap.customer.vatCents),
        gross: formatEuroFromCents(snap.customer.grossCents),
        labor: formatEuroFromCents(snap.admin.cost.laborCostCents),
        overhead: formatEuroFromCents(snap.admin.cost.overheadCents),
        totalCost: formatEuroFromCents(snap.admin.cost.totalCostCents),
        marginPercent: Math.round(snap.admin.price.realizedMargin * 1000) / 10,
      },
    });
  }

  const archive = await getCleaningQuoteByReference(id);
  if (archive) {
    const snap = archive.snapshot;
    return NextResponse.json({
      kind: "archive",
      archive,
      terminUrl: null,
      customer: snap.customer,
      admin: snap.admin,
      contact: snap.contact,
      input: snap.input,
      quoteReference: snap.quoteReference,
      configVersionId: snap.configVersionId,
      money: {
        net: formatEuroFromCents(snap.customer.netCents),
        vat: formatEuroFromCents(snap.customer.vatCents),
        gross: formatEuroFromCents(snap.customer.grossCents),
        labor: formatEuroFromCents(snap.admin.cost.laborCostCents),
        overhead: formatEuroFromCents(snap.admin.cost.overheadCents),
        totalCost: formatEuroFromCents(snap.admin.cost.totalCostCents),
        marginPercent: Math.round(snap.admin.price.realizedMargin * 1000) / 10,
      },
    });
  }

  // Fallback: find lead by anfrageNr
  const leads = filterBueroLeads(await listLeads(200));
  const byRef = leads.find((l) => l.anfrageNr === id || l.cleaningSnapshot?.quoteReference === id);
  if (byRef?.cleaningSnapshot) {
    const snap = byRef.cleaningSnapshot;
    return NextResponse.json({
      kind: "lead",
      lead: byRef,
      terminUrl: buildTerminPageUrl(origin, byRef.id),
      customer: snap.customer,
      admin: snap.admin,
      contact: snap.contact,
      input: snap.input,
      quoteReference: snap.quoteReference,
      configVersionId: snap.configVersionId,
      money: {
        net: formatEuroFromCents(snap.customer.netCents),
        vat: formatEuroFromCents(snap.customer.vatCents),
        gross: formatEuroFromCents(snap.customer.grossCents),
        labor: formatEuroFromCents(snap.admin.cost.laborCostCents),
        overhead: formatEuroFromCents(snap.admin.cost.overheadCents),
        totalCost: formatEuroFromCents(snap.admin.cost.totalCostCents),
        marginPercent: Math.round(snap.admin.price.realizedMargin * 1000) / 10,
      },
    });
  }

  return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
}
