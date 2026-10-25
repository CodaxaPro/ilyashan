import type { ConciergeSession } from "@/lib/concierge/types";
import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import {
  advanceTreppenhausDialog,
  shouldHandleTreppenhausDialog,
} from "../dialog/treppenhaus";
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
    name: "advance_treppenhaus_dialog",
    description:
      "Treppenhaus: führt das Gespräch (fragt Stockwerke, Wohnungen, Turnus, …), rechnet mit dem echten Preismotor und aktualisiert bei Änderungen. Bei jeder Treppenhaus-Preisfrage oder Angabe nutzen.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Aktuelle Kundenachricht" },
      },
      required: ["message"],
    },
  },
  {
    name: "get_price_guidance",
    description:
      "Allgemeine Preisliste / Preisfrage ohne Treppenhaus-Dialog. Nicht für laufende Treppenhaus-Kalkulation nutzen.",
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
  session?: ConciergeSession;
};

export type ToolExecResult = {
  content: string;
  customerText?: string;
  emittedEuro?: boolean;
  actionsJson?: string;
  quickReplies?: string[];
  session?: ConciergeSession;
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

  if (name === "advance_treppenhaus_dialog") {
    const message = String(args.message ?? "");
    const session = ctx.session;
    if (!session) {
      return {
        content: JSON.stringify({ ok: false, error: "missing_session" }),
      };
    }
    if (!shouldHandleTreppenhausDialog(session, message) && !session.treppenhausDraft) {
      // still allow start if message mentions price + treppenhaus already filtered by caller
    }
    const result = advanceTreppenhausDialog(session, message);
    return {
      content: JSON.stringify({
        ok: true,
        complete: result.complete,
        emittedEuro: result.emittedEuro,
        text: result.text,
      }),
      customerText: result.text,
      emittedEuro: result.emittedEuro,
      actionsJson: JSON.stringify(result.actions),
      quickReplies: result.quickReplies,
      session: result.session,
    };
  }

  if (name === "get_price_guidance") {
    const message = String(args.message ?? "");
    // Prefer live Treppenhaus dialog when product matches
    if (ctx.session && shouldHandleTreppenhausDialog(ctx.session, message)) {
      const result = advanceTreppenhausDialog(ctx.session, message);
      return {
        content: JSON.stringify({
          ok: true,
          product: "treppenhaus",
          text: result.text,
          emittedEuro: result.emittedEuro,
          complete: result.complete,
        }),
        customerText: result.text,
        emittedEuro: result.emittedEuro,
        actionsJson: JSON.stringify(result.actions),
        quickReplies: result.quickReplies,
        session: result.session,
      };
    }
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
