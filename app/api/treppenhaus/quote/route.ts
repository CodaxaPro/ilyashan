import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/lib/config";
import { saveLead } from "@/lib/leads-store";
import { syncLeadToCalendar } from "@/lib/calendar/calendar-service";
import { checkRateLimit, clientIpFromRequest } from "@/lib/cleaning/rate-limit";
import {
  buildTreppenhausAdminEmail,
  buildTreppenhausCustomerEmail,
} from "@/lib/treppenhaus/emails";
import { createTreppenhausStoredLead } from "@/lib/treppenhaus/lead-bridge";
import {
  buildTreppenhausSnapshot,
  type TreppenhausContact,
} from "@/lib/treppenhaus/snapshot";
import type { DirtLevel, StairTurnus, TreppenhausInput } from "@/lib/treppenhaus/pricing";
import { syncKellerTurnus } from "@/lib/treppenhaus/pricing";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function asTurnus(value: unknown): StairTurnus | null {
  if (value === "weekly" || value === "biweekly" || value === "monthly") return value;
  return null;
}

function asDirt(value: unknown): DirtLevel | null {
  if (value === "normal" || value === "medium" || value === "heavy") return value;
  return null;
}

function normalizeInput(raw: unknown): TreppenhausInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const stairTurnus = asTurnus(r.stairTurnus);
  const dirtLevel = asDirt(r.dirtLevel);
  if (!stairTurnus || !dirtLevel) return null;

  const stockwerke = Number(r.stockwerke);
  const wohnungen = Number(r.wohnungen);
  if (!Number.isFinite(stockwerke) || !Number.isFinite(wohnungen)) return null;

  const keller = Boolean(r.keller);
  const kellerRaw = asTurnus(r.kellerTurnus) ?? stairTurnus;
  const kellerTurnus = keller ? syncKellerTurnus(stairTurnus, kellerRaw) : kellerRaw;

  return {
    stockwerke,
    wohnungen,
    stairTurnus,
    dirtLevel,
    keller,
    kellerTurnus,
    aufzug: Boolean(r.aufzug),
    glasHandlauf: Boolean(r.glasHandlauf),
  };
}

function normalizeContact(raw: unknown): TreppenhausContact | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = String(r.name ?? "").trim();
  const email = String(r.email ?? "").trim();
  const phone = String(r.phone ?? "").trim();
  const postalCode = String(r.postalCode ?? "").trim();
  const city = String(r.city ?? "").trim();
  const street = String(r.street ?? "").trim();
  const notes = String(r.notes ?? "").trim();
  const privacyAccepted = Boolean(r.privacyAccepted);

  if (!name || !email || !phone || !postalCode || !city || !privacyAccepted) return null;
  if (!email.includes("@")) return null;

  return {
    name,
    email,
    phone,
    postalCode,
    city,
    street: street || undefined,
    notes: notes || undefined,
    privacyAccepted,
  };
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`treppenhaus-quote:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (record.website) {
    return NextResponse.json({ success: true });
  }

  const input = normalizeInput(record.input);
  const contact = normalizeContact(record.contact);
  if (!input || !contact) {
    return NextResponse.json(
      {
        error:
          "Bitte Objektangaben sowie Name, E-Mail, Telefon, PLZ, Ort und Datenschutzhinweis ausfüllen.",
      },
      { status: 400 }
    );
  }

  if (!resend || process.env.RESEND_API_KEY?.includes("HIER_IHREN")) {
    return NextResponse.json(
      { error: "E-Mail-Versand ist noch nicht konfiguriert. Bitte rufen Sie uns direkt an." },
      { status: 503 }
    );
  }

  const snapshot = buildTreppenhausSnapshot(input, contact);
  const storedLead = createTreppenhausStoredLead(snapshot);

  const fromEmail = process.env.FROM_EMAIL ?? "Ilyashan <info@ilyashan.de>";
  const toEmail = process.env.CONTACT_EMAIL ?? siteConfig.contact.email;

  const adminEmail = buildTreppenhausAdminEmail(snapshot);
  const { error: adminError } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: adminEmail.replyTo,
    subject: adminEmail.subject,
    text: adminEmail.text,
    html: adminEmail.html,
  });

  if (adminError) {
    console.error("[treppenhaus/quote] admin email failed:", adminError);
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns an." },
      { status: 500 }
    );
  }

  const customerEmail = buildTreppenhausCustomerEmail(snapshot);
  const { error: customerError } = await resend.emails.send({
    from: fromEmail,
    to: [contact.email],
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
  });
  if (customerError) {
    console.error("[treppenhaus/quote] customer email failed:", customerError);
  }

  await saveLead(storedLead);
  try {
    await syncLeadToCalendar(storedLead);
  } catch (err) {
    console.error("[treppenhaus/quote] calendar sync failed:", err);
  }

  return NextResponse.json({
    success: true,
    anfrageNr: snapshot.quoteReference,
    monthlyNetCents: snapshot.quote.monthlyNetCents,
    monthlyGrossCents: snapshot.quote.monthlyGrossCents,
    needsInspection: snapshot.quote.needsInspection,
  });
}
