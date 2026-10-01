import { NextResponse } from "next/server";
import {
  detectPriceInjection,
  normalizeCustomerInput,
} from "@/lib/cleaning/normalize-input";
import {
  logClientServerDiscrepancy,
  serverCalculateCleaningQuote,
} from "@/lib/cleaning/server-calculate";
import { checkRateLimit, clientIpFromRequest } from "@/lib/cleaning/rate-limit";

export const runtime = "nodejs";

/**
 * Public preview calculate — returns customer-safe fields only.
 * Server always recalculates; never trusts client price.
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`cleaning-calc:${ip}`, 60, 60_000);
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
  const injected = detectPriceInjection(record.input ?? record);
  if (injected.length > 0) {
    return NextResponse.json(
      { error: "Ungültige Preisfelder in der Anfrage." },
      { status: 400 }
    );
  }

  const input = normalizeCustomerInput(record.input ?? record);
  const { public: customer, calc, blocking } = serverCalculateCleaningQuote(input);

  const clientPreviewNetCents =
    typeof record.clientPreviewNetCents === "number"
      ? record.clientPreviewNetCents
      : undefined;
  logClientServerDiscrepancy({
    clientNetCents: clientPreviewNetCents,
    serverNetCents: customer.netCents,
  });

  return NextResponse.json({
    success: true,
    quote: customer,
    validation: calc.admin.validation.map((v) => ({
      code: v.code,
      level: v.level,
      message: input.language === "tr" ? v.messageTr : v.messageDe,
    })),
    blocking,
    // Explicitly no admin/cost/margin
  });
}
