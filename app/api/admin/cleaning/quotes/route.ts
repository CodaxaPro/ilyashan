import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { listCleaningQuotes } from "@/lib/cleaning/quotes-store";
import { listLeads } from "@/lib/leads-store";
import { filterBueroLeads } from "@/lib/cleaning/admin-overview";
import { formatEuroFromCents } from "@/lib/cleaning/money";

export const runtime = "nodejs";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const [archive, leads] = await Promise.all([listCleaningQuotes(200), listLeads(200)]);
  const bueroLeads = filterBueroLeads(leads);

  const fromArchive = archive.map((q) => ({
    id: q.id,
    source: "archive" as const,
    quoteReference: q.quoteReference,
    createdAt: q.createdAt,
    company: q.company,
    contactPerson: q.contactPerson,
    email: q.email,
    postalCode: q.postalCode,
    city: q.city,
    totalAreaM2: q.totalAreaM2,
    frequency: q.frequency,
    netCents: q.netCents,
    grossCents: q.grossCents,
    netLabel: formatEuroFromCents(q.netCents),
    grossLabel: formatEuroFromCents(q.grossCents),
    quoteStatus: q.quoteStatus,
    configVersionId: q.configVersionId,
    leadId: null as string | null,
  }));

  const fromLeads = bueroLeads.map((lead) => {
    const snap = lead.cleaningSnapshot!;
    return {
      id: lead.id,
      source: "lead" as const,
      quoteReference: lead.anfrageNr ?? snap.quoteReference,
      createdAt: lead.createdAt,
      company: snap.contact.company,
      contactPerson: snap.contact.contactPerson,
      email: lead.email ?? snap.contact.email,
      postalCode: snap.contact.postalCode,
      city: snap.contact.city,
      totalAreaM2: snap.input.totalAreaM2,
      frequency: snap.input.frequency,
      netCents: snap.customer.netCents,
      grossCents: snap.customer.grossCents,
      netLabel: formatEuroFromCents(snap.customer.netCents),
      grossLabel: formatEuroFromCents(snap.customer.grossCents),
      quoteStatus: snap.customer.quoteStatus,
      configVersionId: snap.configVersionId,
      leadId: lead.id,
      status: lead.status ?? "neu",
      festpreis: lead.festpreis ?? null,
    };
  });

  const seen = new Set<string>();
  const items = [...fromLeads, ...fromArchive].filter((item) => {
    const key = item.quoteReference;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ items, count: items.length });
}
