import type {
  ConciergeAction,
  ConciergeReply,
  ConciergeSession,
} from "@/lib/concierge/types";
import { phoneAction } from "@/lib/concierge/knowledge";
import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { buildAssistantPriceReply, isGeneralPriceListAsk } from "../reply";
import { ASSISTANT_TOOL_DEFINITIONS, executeAllowlistedTool } from "../tools/registry";
import { enforceNoInventedPrice } from "./guards";
import { buildAssistantSystemPrompt } from "./system-prompt";
import type { AiMessage, AiProvider, AiRunMeta } from "./types";

const MAX_TOOL_ROUNDS = 4;

function looksLikePriceQuestion(message: string): boolean {
  return isGeneralPriceListAsk(message) || /\b(preis|kost|teuer|angebot|kalkul|fiyat)/i.test(message);
}

export type AiRunResult = {
  reply: ConciergeReply;
  meta: AiRunMeta;
};

/**
 * AI + API loop: model may only call allowlisted tools; dialog/price tool text wins.
 */
export async function runAssistantAi(options: {
  message: string;
  session: ConciergeSession;
  provider: AiProvider;
  fensterPartial?: Partial<QuoteFormData>;
  pricingCtx?: QuotePricingContext;
}): Promise<AiRunResult> {
  const { message, session, provider } = options;
  const messages: AiMessage[] = [
    { role: "system", content: buildAssistantSystemPrompt(session) },
    { role: "user", content: message },
  ];

  const toolNames: string[] = [];
  let workingSession = session;
  let authorizedEuro = false;
  let authoritativeText: string | null = null;
  let actions: ConciergeAction[] = [phoneAction()];
  let quickReplies = ["Preisrechner", "Leistungen", "Kontakt"];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await provider.complete({
      messages,
      tools: ASSISTANT_TOOL_DEFINITIONS,
    });

    if (completion.toolCalls.length === 0) {
      if (!authoritativeText && looksLikePriceQuestion(message)) {
        const policy = buildAssistantPriceReply(
          message,
          options.fensterPartial ?? workingSession.quote,
          options.pricingCtx
        );
        return {
          reply: {
            text: policy.text,
            intent: "price",
            session: {
              ...workingSession,
              turns: workingSession.turns + 1,
              lastIntent: "price",
              stage: "idle",
            },
            actions: policy.actions,
            quickReplies: ["Fenster-Preisrechner", "Büro", "Treppenhaus"],
          },
          meta: {
            usedAi: true,
            providerId: provider.id,
            toolNames,
            fallbackReason: "forced_price_policy_without_tool",
          },
        };
      }

      const raw =
        (completion.content ?? "").trim() || "Wie kann ich Ihnen bei der Reinigung helfen?";
      const guarded = enforceNoInventedPrice(
        authoritativeText ?? raw,
        authoritativeText ? authorizedEuro : false
      );
      const text = authoritativeText ?? guarded.text;

      return {
        reply: {
          text,
          intent: authoritativeText ? "price" : "unknown",
          session: {
            ...workingSession,
            turns: workingSession.turns + 1,
            lastIntent: authoritativeText ? "price" : "unknown",
            stage: "idle",
          },
          actions,
          quickReplies,
        },
        meta: {
          usedAi: true,
          providerId: provider.id,
          toolNames,
          fallbackReason: guarded.blockedInventedPrice ? "blocked_invented_price" : null,
        },
      };
    }

    messages.push({
      role: "assistant",
      content: completion.content,
      toolCalls: completion.toolCalls,
    });

    for (const call of completion.toolCalls) {
      toolNames.push(call.name);
      const exec = await executeAllowlistedTool(call.name, call.argumentsJson, {
        fensterPartial: options.fensterPartial ?? workingSession.quote,
        pricingCtx: options.pricingCtx,
        session: workingSession,
      });

      if (exec.session) workingSession = exec.session;
      if (exec.customerText) {
        authoritativeText = exec.customerText;
        authorizedEuro = Boolean(exec.emittedEuro);
      }
      if (exec.actionsJson) {
        try {
          actions = JSON.parse(exec.actionsJson) as ConciergeAction[];
        } catch {
          /* keep */
        }
      }
      if (exec.quickReplies?.length) quickReplies = exec.quickReplies;

      messages.push({
        role: "tool",
        toolCallId: call.id,
        name: call.name,
        content: exec.content,
      });

      // Authoritative sales/price text — return immediately (no model paraphrase)
      if (
        exec.customerText &&
        (call.name === "advance_treppenhaus_dialog" ||
          call.name === "upsert_treppenhaus_fields" ||
          call.name === "upsert_fenster_fields" ||
          call.name === "submit_customer_lead" ||
          call.name === "get_price_guidance")
      ) {
        return {
          reply: {
            text: exec.customerText,
            intent: "price",
            session: workingSession,
            actions,
            quickReplies,
          },
          meta: {
            usedAi: true,
            providerId: provider.id,
            toolNames,
            fallbackReason: null,
          },
        };
      }
    }
  }

  return {
    reply: {
      text:
        authoritativeText ??
        "Gerne helfe ich weiter — sagen Sie mir kurz Stockwerke und Wohnungen, oder rufen Sie uns an.",
      intent: authoritativeText ? "price" : "unknown",
      session: {
        ...workingSession,
        turns: workingSession.turns + 1,
        lastIntent: authoritativeText ? "price" : "unknown",
      },
      actions,
      quickReplies,
    },
    meta: {
      usedAi: true,
      providerId: provider.id,
      toolNames,
      fallbackReason: "max_tool_rounds",
    },
  };
}
