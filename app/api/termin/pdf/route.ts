import { NextResponse } from "next/server";
import { verifyTerminToken } from "@/lib/termin-token";
import { getLead } from "@/lib/leads-store";
import { generateQuotePdfBuffer } from "@/lib/pdf/generate-quote-pdf";
import { resolveServerQuotePricing } from "@/lib/quote-pricing-context";
import { initialQuoteFormData } from "@/lib/quote-form";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const payload = verifyTerminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 401 });
  }

  const lead = await getLead(payload.leadId);
  if (!lead || lead.source !== "quote" || !lead.quote?.windowCount) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  const quote = { ...initialQuoteFormData, ...lead.quote };
  const ctx = await resolveServerQuotePricing(lead);
  const pdf = await generateQuotePdfBuffer(quote, lead.anfrageNr ?? lead.id, ctx);
  const filename = `${lead.anfrageNr ?? lead.id}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
