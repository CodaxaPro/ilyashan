import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { buildAssistantPriceReply } from "../reply";
import { resolveProduct } from "../resolve-product";
import type { AiToolDefinition } from "../ai/types";

export const ASSISTANT_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    name: "resolve_product",
    description:
      "Erkennt, welche Ilyashan-Leistung der Kunde meint (fenster, buero, treppenhaus, praxis, …).",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Kundenachricht" },
      },
      required: ["message"],
    },
  },
  {
    name: "get_price_guidance",
    description:
      "Liefert die verbindliche Preis-/Prozess-Antwort aus den Ilyashan-Preis-APIs und Policies. Niemals selbst einen Preis nennen — dieses Tool nutzen.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Kundenachricht zur Preisfrage" },
      },
      required: ["message"],
    },
  },
];

const ALLOWED = new Set(ASSISTANT_TOOL_DEFINITIONS.map((t) => t.name));

export function isAllowlistedTool(name: string): boolean {
  return ALLOWED.has(name);
}

export type ToolExecContext = {
  fensterPartial?: Partial<QuoteFormData>;
  pricingCtx?: QuotePricingContext;
};

export type ToolExecResult = {
  content: string;
  /** Customer-ready text from pricing policy (prefer over model paraphrase). */
  customerText?: string;
  emittedEuro?: boolean;
  actionsJson?: string;
};

export function executeAllowlistedTool(
  name: string,
  argumentsJson: string,
  ctx: ToolExecContext = {}
): ToolExecResult {
  if (!isAllowlistedTool(name)) {
    return {
      content: JSON.stringify({
        ok: false,
        error: "tool_not_allowlisted",
        messageDe: "Dieses Werkzeug ist nicht freigegeben.",
      }),
    };
  }

  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argumentsJson || "{}") as Record<string, unknown>;
  } catch {
    return {
      content: JSON.stringify({
        ok: false,
        error: "invalid_json",
        messageDe: "Tool-Argumente ungültig.",
      }),
    };
  }

  if (name === "resolve_product") {
    const message = String(args.message ?? "");
    const result = resolveProduct(message);
    return { content: JSON.stringify(result) };
  }

  if (name === "get_price_guidance") {
    const message = String(args.message ?? "");
    const reply = buildAssistantPriceReply(message, ctx.fensterPartial, ctx.pricingCtx);
    return {
      content: JSON.stringify({
        ok: true,
        product: reply.product,
        text: reply.text,
        emittedEuro: reply.emittedEuro,
        actions: reply.actions,
      }),
      customerText: reply.text,
      emittedEuro: reply.emittedEuro,
      actionsJson: JSON.stringify(reply.actions),
    };
  }

  return {
    content: JSON.stringify({ ok: false, error: "unhandled_tool" }),
  };
}
