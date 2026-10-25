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
import {
  applyFensterStructuredFields,
  type FensterStructuredPatch,
} from "../dialog/fenster";
import {
  buildSystemKnowledgeDetail,
  type SystemKnowledgeTopic,
} from "../knowledge/system-card";
import { applyBueroStructuredFields } from "../dialog/buero";
import { ALL_SALES_PRODUCTS, openServiceCase } from "../sales/catalog";
import { listProposedSlots } from "../sales/slots";
import { submitSalesLead } from "../sales/submit-lead";
import { buildAssistantPriceReply } from "../reply";
import { resolveProduct } from "../resolve-product";
import type { AiToolDefinition } from "../ai/types";
import type { FloorLevel, DirtLevel, CleaningSide, QuoteServiceId } from "@/lib/quote-form";
import type { AssistantProduct, BueroChatDraft } from "@/lib/concierge/types";

export const ASSISTANT_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    name: "get_system_knowledge",
    description:
      "Liest das echte Ilyashan-System (Config + Preismotoren): overview, products, treppenhaus, process, area, contact. Bei Firmen-/Prozess-/Gebietsfragen IMMER nutzen statt zu raten.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["overview", "products", "treppenhaus", "process", "area", "contact"],
          description: "Welchen Systemteil lesen",
        },
      },
      required: ["topic"],
    },
  },
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
    name: "open_service_case",
    description:
      "Startet den Verkaufsfall für JEDE Leistung (fenster, buero, treppenhaus, praxis, bauend, renovierung, entruempelung, gutschein). Immer zuerst bei erkennbarer Leistung nutzen.",
    parameters: {
      type: "object",
      properties: {
        product: {
          type: "string",
          enum: [
            "fenster",
            "buero",
            "treppenhaus",
            "praxis",
            "bauend",
            "renovierung",
            "entruempelung",
            "gutschein",
          ],
        },
      },
      required: ["product"],
    },
  },
  {
    name: "upsert_buero_fields",
    description:
      "Büroreinigung: m² + Turnus (+ optional Arbeitsplätze) → echter Büro-Preismotor.",
    parameters: {
      type: "object",
      properties: {
        totalAreaM2: { type: "number" },
        frequency: {
          type: "string",
          enum: ["ONE_TIME", "1_PER_WEEK", "2_PER_WEEK", "3_PER_WEEK", "5_PER_WEEK"],
        },
        workstations: { type: "integer" },
      },
    },
  },
  {
    name: "upsert_fenster_fields",
    description:
      "Fensterreinigung: Flügel/Etage/etc. aus Kundenabsicht mappen und mit dem echten Fenster-Preismotor rechnen.",
    parameters: {
      type: "object",
      properties: {
        windowCount: { type: "integer" },
        floorLevel: {
          type: "string",
          enum: ["eg", "og1", "og2", "og3", "og4", "og5plus", "dg"],
        },
        dirtLevel: {
          type: "string",
          enum: ["leicht", "normal", "stark", "extrem"],
        },
        cleaningSide: {
          type: "string",
          enum: ["innen_aussen", "nur_innen", "nur_aussen"],
        },
        services: {
          type: "array",
          items: { type: "string", enum: ["privat", "gewerbe", "wartung"] },
        },
        postalCode: { type: "string" },
        city: { type: "string" },
      },
    },
  },
  {
    name: "get_available_slots",
    description:
      "Liest echte Kalender-Kapazität (Vormittag/Nachmittag) und liefert Terminvorschläge für den Kunden.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max. Vorschläge, default 8" },
      },
    },
  },
  {
    name: "submit_customer_lead",
    description:
      "ABSCHLUSS: Speichert Name+Telefon (+Notiz/Terminwunsch) in CRM und mailt an Ilyashan. Immer nutzen wenn Kunde Rückruf/Festpreis/Termin will und Kontaktdaten da sind.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        customerNote: {
          type: "string",
          description: "Terminwunsch, PLZ, besondere Hinweise",
        },
      },
      required: ["name", "phone"],
    },
  },
  {
    name: "get_price_guidance",
    description:
      "Allgemeine Preisliste / Preisfrage. Bei Treppenhaus/Fenster lieber die upsert_*-Tools.",
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

export async function executeAllowlistedTool(
  name: string,
  argumentsJson: string,
  ctx: ToolExecContext = {}
): Promise<ToolExecResult> {
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

  if (name === "get_available_slots") {
    const limit = Math.min(12, Math.max(3, Number(args.limit) || 8));
    const slots = await listProposedSlots(limit);
    return {
      content: JSON.stringify({
        ok: true,
        slots,
        hintDe:
          "Schlage 2–3 Optionen vor. Verbindliche Buchung nach Lead/Prüfung — Wunsch mit submit_customer_lead notieren.",
      }),
    };
  }

  if (name === "submit_customer_lead") {
    const session = ctx.session;
    if (!session) {
      return { content: JSON.stringify({ ok: false, error: "missing_session" }) };
    }
    const result = await submitSalesLead({
      name: String(args.name ?? ""),
      phone: String(args.phone ?? ""),
      customerNote: args.customerNote ? String(args.customerNote) : undefined,
      session,
    });
    if (!result.ok) {
      return {
        content: JSON.stringify(result),
        customerText: result.messageDe,
      };
    }
    return {
      content: JSON.stringify(result),
      customerText: result.messageDe,
      session: { ...session, turns: session.turns + 1, stage: "idle" },
      quickReplies: ["Weitere Frage", "WhatsApp", "Leistungen"],
    };
  }

  if (name === "open_service_case") {
    const session = ctx.session;
    if (!session) {
      return { content: JSON.stringify({ ok: false, error: "missing_session" }) };
    }
    const product = String(args.product ?? "") as AssistantProduct;
    if (!ALL_SALES_PRODUCTS.includes(product)) {
      return {
        content: JSON.stringify({ ok: false, error: "unknown_product" }),
        customerText:
          "Welche Leistung meinen Sie — Fenster, Büro, Treppenhaus, Praxis, Bauend, Renovierung, Entrümpelung oder Gutschein?",
      };
    }
    const result = openServiceCase(session, product);
    return {
      content: JSON.stringify({ ok: true, product, text: result.text }),
      customerText: result.text,
      actionsJson: JSON.stringify(result.actions),
      quickReplies: result.quickReplies,
      session: result.session,
    };
  }

  if (name === "upsert_buero_fields") {
    const session = ctx.session;
    if (!session) {
      return { content: JSON.stringify({ ok: false, error: "missing_session" }) };
    }
    const patch: BueroChatDraft = {};
    if (args.totalAreaM2 !== undefined) patch.totalAreaM2 = Number(args.totalAreaM2);
    if (typeof args.frequency === "string") {
      patch.frequency = args.frequency as BueroChatDraft["frequency"];
    }
    if (args.workstations !== undefined) patch.workstations = Number(args.workstations);
    const result = applyBueroStructuredFields(session, patch);
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

  if (name === "upsert_fenster_fields") {
    const session = ctx.session;
    if (!session) {
      return { content: JSON.stringify({ ok: false, error: "missing_session" }) };
    }
    const patch: FensterStructuredPatch = {};
    if (args.windowCount !== undefined) patch.windowCount = Number(args.windowCount);
    if (typeof args.floorLevel === "string") patch.floorLevel = args.floorLevel as FloorLevel;
    if (typeof args.dirtLevel === "string") patch.dirtLevel = args.dirtLevel as DirtLevel;
    if (typeof args.cleaningSide === "string") {
      patch.cleaningSide = args.cleaningSide as CleaningSide;
    }
    if (Array.isArray(args.services)) {
      patch.services = args.services as QuoteServiceId[];
    }
    if (typeof args.postalCode === "string") patch.postalCode = args.postalCode;
    if (typeof args.city === "string") patch.city = args.city;
    const result = applyFensterStructuredFields(session, patch, ctx.pricingCtx);
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

  if (name === "get_system_knowledge") {
    const topicRaw = String(args.topic ?? "overview");
    const allowed: SystemKnowledgeTopic[] = [
      "overview",
      "products",
      "treppenhaus",
      "process",
      "area",
      "contact",
    ];
    const topic = (allowed.includes(topicRaw as SystemKnowledgeTopic)
      ? topicRaw
      : "overview") as SystemKnowledgeTopic;
    return {
      content: JSON.stringify({
        ok: true,
        topic,
        knowledge: buildSystemKnowledgeDetail(topic),
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
    if (ctx.session) {
      const resolved = resolveProduct(message);
      if (
        resolved.ok &&
        resolved.data.product !== "unknown" &&
        ALL_SALES_PRODUCTS.includes(resolved.data.product as AssistantProduct)
      ) {
        const opened = openServiceCase(
          ctx.session,
          resolved.data.product as AssistantProduct
        );
        return {
          content: JSON.stringify({
            ok: true,
            product: resolved.data.product,
            text: opened.text,
          }),
          customerText: opened.text,
          actionsJson: JSON.stringify(opened.actions),
          quickReplies: opened.quickReplies,
          session: opened.session,
        };
      }
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
