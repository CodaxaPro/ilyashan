/**
 * Assistant tool contracts — Phase A (read/price routing only).
 * No WhatsApp Cloud, no voice, no lead writes in this layer yet.
 */

export type AssistantProductLine =
  | "fenster"
  | "buero"
  | "treppenhaus"
  | "praxis"
  | "bauend"
  | "renovierung"
  | "entruempelung"
  | "gutschein"
  | "unknown";

/** How a price may be communicated to a customer. */
export type PriceDisclosure =
  /** Same engine as the public calculator — Orientierung only. */
  | "orientierung"
  /** No online engine — never invent a number. */
  | "manual_festpreis_only"
  /** Engine exists but chat lacks safe inputs — send to calculator. */
  | "calculator_required";

export type AssistantToolName =
  | "resolve_product"
  | "price_fenster"
  | "price_treppenhaus"
  | "price_buero"
  | "price_manual_service"
  | "calculator_link";

export type AssistantToolOk<T> = {
  ok: true;
  tool: AssistantToolName;
  data: T;
};

export type AssistantToolErr = {
  ok: false;
  tool: AssistantToolName;
  code:
    | "missing_inputs"
    | "out_of_range"
    | "no_online_price"
    | "calculator_required"
    | "unsupported";
  messageDe: string;
  missingFields?: string[];
  calculatorHref?: string;
};

export type AssistantToolResult<T> = AssistantToolOk<T> | AssistantToolErr;

export type ProductResolveData = {
  product: AssistantProductLine;
  disclosure: PriceDisclosure;
  calculatorHref: string | null;
  confidence: "high" | "medium" | "low";
};

export type OrientierungPriceData = {
  product: AssistantProductLine;
  /** Brutto cents when the public surface shows brutto; else netto as documented. */
  monthlyOrTotalGrossCents: number;
  monthlyOrTotalNetCents: number;
  labelDe: string;
  disclaimerDe: string;
  needsInspection: boolean;
};
