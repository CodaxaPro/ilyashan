import type { ConciergeSession } from "@/lib/concierge/types";
import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import {
  advanceTreppenhausDialog,
  applyTreppenhausStructuredFields,
  getTreppenhausSystemCard,
  shouldHandleTreppenhausDialog,
  type TreppenhausStructuredPatch,
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
    name: "get_treppenhaus_schema",
    description:
      "Liest das Treppenhaus-System: Pflichtfelder, Enums, aktueller Entwurf, fehlende Felder. Keine €-Beträge. Vor dem Interpretieren unklarer Kundenantworten nutzen.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "upsert_treppenhaus_fields",
    description:
      "Haupt-Tool Treppenhaus: Du verstehst die Kundenabsicht (auch umgangssprachlich/türkisch) und schreibst strukturierte Felder. Das Tool fragt weiter oder rechnet mit dem echten Preismotor. Nie selbst € nennen. Bei „stimmt das?“ confirmQuote=true.",
    parameters: {
      type: "object",
      properties: {
        stockwerke: { type: "integer", description: "1–12 inkl. EG" },
        wohnungen: { type: "integer", description: "1–40" },
        stairTurnus: {
          type: "string",
          enum: ["weekly", "biweekly", "monthly"],
        },
        dirtLevel: {
          type: "string",
          enum: ["normal", "medium", "heavy"],
        },
        keller: { type: "boolean" },
        kellerTurnus: {
          type: "string",
          enum: ["weekly", "biweekly", "monthly"],
        },
        aufzug: { type: "boolean" },
        glasHandlauf: { type: "boolean" },
        exit: { type: "boolean", description: "Treppenhaus-Dialog beenden" },
        confirmQuote: {
          type: "boolean",
          description: "Bestehende Motor-Kalkulation erneut ausgeben / bestätigen",
        },
      },
    },
  },
  {
    name: "advance_treppenhaus_dialog",
    description:
      "Fallback-Treppenhaus-Dialog mit Rohtext. Bevorzugt upsert_treppenhaus_fields nutzen. Nur wenn du Felder nicht sicher mappen kannst.",
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
      "Allgemeine Preisliste / Preisfrage ohne laufende Treppenhaus-Kalkulation. Bei Treppenhaus lieber upsert_treppenhaus_fields.",
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

function parseStructuredPatch(args: Record<string, unknown>): TreppenhausStructuredPatch {
  const patch: TreppenhausStructuredPatch = {};
  if (args.stockwerke !== undefined) patch.stockwerke = Number(args.stockwerke);
  if (args.wohnungen !== undefined) patch.wohnungen = Number(args.wohnungen);
  if (typeof args.stairTurnus === "string") {
    patch.stairTurnus = args.stairTurnus as TreppenhausStructuredPatch["stairTurnus"];
  }
  if (typeof args.dirtLevel === "string") {
    patch.dirtLevel = args.dirtLevel as TreppenhausStructuredPatch["dirtLevel"];
  }
  if (typeof args.keller === "boolean") patch.keller = args.keller;
  if (typeof args.kellerTurnus === "string") {
    patch.kellerTurnus = args.kellerTurnus as TreppenhausStructuredPatch["kellerTurnus"];
  }
  if (typeof args.aufzug === "boolean") patch.aufzug = args.aufzug;
  if (typeof args.glasHandlauf === "boolean") patch.glasHandlauf = args.glasHandlauf;
  if (args.exit === true) patch.exit = true;
  if (args.confirmQuote === true) patch.confirmQuote = true;
  return patch;
}

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

  if (name === "get_treppenhaus_schema") {
    return {
      content: JSON.stringify({
        ok: true,
        card: getTreppenhausSystemCard(ctx.session),
      }),
    };
  }

  if (name === "upsert_treppenhaus_fields") {
    const session = ctx.session;
    if (!session) {
      return {
        content: JSON.stringify({ ok: false, error: "missing_session" }),
      };
    }
    const patch = parseStructuredPatch(args);
    // Empty upsert while not in product yet → start collection
    const starting =
      Object.keys(patch).length === 0 &&
      !session.treppenhausDraft &&
      session.assistantProduct !== "treppenhaus";
    const result = starting
      ? advanceTreppenhausDialog(session, "Treppenhaus")
      : applyTreppenhausStructuredFields(session, patch);
    return {
      content: JSON.stringify({
        ok: true,
        complete: result.complete,
        emittedEuro: result.emittedEuro,
        exited: result.exited ?? false,
        text: result.text,
        draft: result.session.treppenhausDraft ?? null,
      }),
      customerText: result.text,
      emittedEuro: result.emittedEuro,
      actionsJson: JSON.stringify(result.actions),
      quickReplies: result.quickReplies,
      session: result.session,
    };
  }

  if (name === "advance_treppenhaus_dialog") {
    const message = String(args.message ?? "");
    const session = ctx.session;
    if (!session) {
      return {
        content: JSON.stringify({ ok: false, error: "missing_session" }),
      };
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
