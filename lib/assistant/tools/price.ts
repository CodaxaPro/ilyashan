import { buildPriceResponse, quoteDataForEstimate } from "@/lib/concierge/pricing-response";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { calculatePriceEstimate } from "@/lib/pricing";
import { calculateTreppenhausQuote, formatEuroFromCents } from "@/lib/treppenhaus/pricing";
import type { TreppenhausInput } from "@/lib/treppenhaus/pricing";
import { calculateOfficeCleaningQuote } from "@/lib/cleaning/calculate";
import type { CustomerInput } from "@/lib/cleaning/types";
import { routes } from "@/lib/routes";
import {
  CALCULATOR_REQUIRED_DISCLAIMER_DE,
  MANUAL_PRICE_DISCLAIMER_DE,
  ORIENTIERUNG_DISCLAIMER_DE,
  calculatorHrefFor,
  mayEmitEuroAmount,
} from "../policy";
import type {
  AssistantProductLine,
  AssistantToolResult,
  OrientierungPriceData,
} from "../types";

/**
 * Fenster — only free-text chat path allowed to emit € (existing concierge engine).
 */
export function priceFenster(
  partial: Partial<QuoteFormData>,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): AssistantToolResult<OrientierungPriceData> {
  const data = quoteDataForEstimate(partial);
  if (!data) {
    return {
      ok: false,
      tool: "price_fenster",
      code: "missing_inputs",
      messageDe: "Für die Fenster-Orientierung fehlen Flügelzahl und Etage.",
      missingFields: [
        !partial.windowCount ? "windowCount" : "",
        !partial.floorLevel ? "floorLevel" : "",
      ].filter(Boolean),
      calculatorHref: routes.angebot,
    };
  }

  const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
  if (!estimate) {
    return {
      ok: false,
      tool: "price_fenster",
      code: "unsupported",
      messageDe: "Für diese Angaben ist keine Online-Orientierung möglich.",
      calculatorHref: routes.angebot,
    };
  }

  const text = buildPriceResponse(partial, ctx);
  if (!text) {
    return {
      ok: false,
      tool: "price_fenster",
      code: "unsupported",
      messageDe: "Für diese Angaben ist keine Online-Orientierung möglich.",
      calculatorHref: routes.angebot,
    };
  }

  return {
    ok: true,
    tool: "price_fenster",
    data: {
      product: "fenster",
      monthlyOrTotalGrossCents: Math.round(estimate.amount * 100),
      monthlyOrTotalNetCents: Math.round(estimate.amount * 100),
      labelDe: text,
      disclaimerDe: ORIENTIERUNG_DISCLAIMER_DE,
      needsInspection: false,
    },
  };
}

/**
 * Treppenhaus — structured input only (same engine as /api/treppenhaus/quote).
 * Phase A chat passes null → calculator link, no invented €.
 */
export function priceTreppenhaus(
  input: TreppenhausInput | null
): AssistantToolResult<OrientierungPriceData> {
  if (!input) {
    return {
      ok: false,
      tool: "price_treppenhaus",
      code: "calculator_required",
      messageDe:
        "Gerne rechne ich die Treppenhausreinigung durch. Schreiben Sie z. B. „Treppenhaus“ — ich frage Stockwerke, Wohnungen und Turnus und kalkuliere live mit unserem Preismotor.",
      calculatorHref: routes.treppenhausreinigungAngebot,
    };
  }

  const quote = calculateTreppenhausQuote(input);
  const labelDe = [
    `Treppenhaus-Orientierung: **${formatEuroFromCents(quote.monthlyGrossCents)} brutto / Monat**`,
    `(${formatEuroFromCents(quote.monthlyNetCents)} netto).`,
    ORIENTIERUNG_DISCLAIMER_DE,
  ].join(" ");

  return {
    ok: true,
    tool: "price_treppenhaus",
    data: {
      product: "treppenhaus",
      monthlyOrTotalGrossCents: quote.monthlyGrossCents,
      monthlyOrTotalNetCents: quote.monthlyNetCents,
      labelDe,
      disclaimerDe: ORIENTIERUNG_DISCLAIMER_DE,
      needsInspection: quote.needsInspection,
    },
  };
}

/**
 * Büro — structured CustomerInput only (same engine as /api/cleaning/quote).
 * Phase A chat passes null → calculator link.
 */
export function priceBuero(
  input: CustomerInput | null
): AssistantToolResult<OrientierungPriceData> {
  if (!input) {
    return {
      ok: false,
      tool: "price_buero",
      code: "calculator_required",
      messageDe:
        "Gerne Büroreinigung — nennen Sie ungefähre m² und Turnus (z. B. 2×/Woche), dann rechne ich die Orientierung. Oder ich nehme Name und Telefon fürs Festpreis-Angebot auf.",
      calculatorHref: routes.bueroreinigungAngebot,
    };
  }

  const { customer } = calculateOfficeCleaningQuote(input);
  const labelDe = [
    `Büro-Orientierung: **${(customer.grossCents / 100).toFixed(2).replace(".", ",")} € brutto**.`,
    ORIENTIERUNG_DISCLAIMER_DE,
  ].join(" ");

  return {
    ok: true,
    tool: "price_buero",
    data: {
      product: "buero",
      monthlyOrTotalGrossCents: customer.grossCents,
      monthlyOrTotalNetCents: customer.netCents,
      labelDe,
      disclaimerDe: ORIENTIERUNG_DISCLAIMER_DE,
      needsInspection: customer.quoteStatus === "MANUAL_REVIEW_REQUIRED",
    },
  };
}

/** Praxis / Bauend / Renovierung / Entrümpelung / Gutschein — never emit €. */
export function priceManualService(
  product: Exclude<AssistantProductLine, "fenster" | "buero" | "treppenhaus" | "unknown">
): AssistantToolResult<OrientierungPriceData> {
  if (mayEmitEuroAmount(product)) {
    return {
      ok: false,
      tool: "price_manual_service",
      code: "unsupported",
      messageDe: "Interner Fehler: Produkt hat Online-Orientierung — falscher Tool-Pfad.",
    };
  }

  const href = calculatorHrefFor(product);
  return {
    ok: false,
    tool: "price_manual_service",
    code: "no_online_price",
    messageDe: `${MANUAL_PRICE_DISCLAIMER_DE} Nennen Sie kurz Objekt/Umfang und Ihre Telefonnummer — ich leite die Anfrage an unser Team weiter (Festpreis nach Prüfung).`,
    calculatorHref: href ?? undefined,
  };
}
