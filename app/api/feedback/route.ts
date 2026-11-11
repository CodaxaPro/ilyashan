import { NextResponse } from "next/server";
import {
  parseCsatScore,
  verifyCsatToken,
  type LeadCsat,
} from "@/lib/csat/policy";
import { getLead, isLeadsStoreConfigured, updateLead } from "@/lib/leads-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const payload = verifyCsatToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 400 });
  }
  const lead = await getLead(payload.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    name: lead.name.split(/\s+/)[0] ?? lead.name,
    alreadySubmitted: Boolean(lead.csat),
    score: lead.csat?.score ?? null,
  });
}

export async function POST(request: Request) {
  if (!isLeadsStoreConfigured()) {
    return NextResponse.json({ error: "Speicher nicht konfiguriert." }, { status: 503 });
  }

  let body: { token?: string; score?: unknown; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = verifyCsatToken(body.token);
  if (!payload) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 400 });
  }

  const score = parseCsatScore(body.score);
  if (!score) {
    return NextResponse.json({ error: "Bitte 1–5 Sterne wählen." }, { status: 400 });
  }

  const lead = await getLead(payload.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }
  if (lead.csat) {
    return NextResponse.json({ ok: true, alreadySubmitted: true, score: lead.csat.score });
  }

  const csat: LeadCsat = {
    score,
    comment: typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : undefined,
    submittedAt: new Date().toISOString(),
    channel: "email_link",
  };

  const updated = await updateLead(payload.leadId, { csat });
  if (!updated) {
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, score });
}
