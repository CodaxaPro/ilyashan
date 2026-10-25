import type { ConciergeAction, ConciergeReply, ConciergeSession } from "@/lib/concierge/types";
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
 * AI + API loop: model may only call allowlisted tools; price text from tools wins.
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
    { role: "system", content: buildAssistantSystemPrompt() },
    { role: "user", content: message },
  ];

  const toolNames: string[] = [];
  let authorizedEuro = false;
  let authoritativeText: string | null = null;
  let actions: ConciergeAction[] = [phoneAction()];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await provider.complete({
      messages,
      tools: ASSISTANT_TOOL_DEFINITIONS,
    });

    if (completion.toolCalls.length === 0) {
      // Fail-closed: price questions without tool → deterministic policy reply
      if (!authoritativeText && looksLikePriceQuestion(message)) {
        const policy = buildAssistantPriceReply(
          message,
          options.fensterPartial ?? session.quote,
          options.pricingCtx
        );
        return {
          reply: {
            text: policy.text,
            intent: "price",
            session: {
              ...session,
              turns: session.turns + 1,
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

      const raw = (completion.content ?? "").trim() || "Wie kann ich Ihnen bei der Reinigung helfen?";
      const guarded = enforceNoInventedPrice(
        authoritativeText ?? raw,
        authoritativeText ? authorizedEuro : false
      );
      const text = authoritativeText ?? guarded.text;
      const finalGuarded = authoritativeText
        ? { text, blockedInventedPrice: false }
        : guarded;

      return {
        reply: {
          text: finalGuarded.text,
          intent: authoritativeText ? "price" : "unknown",
          session: {
            ...session,
            turns: session.turns + 1,
            lastIntent: authoritativeText ? "price" : "unknown",
            stage: "idle",
          },
          actions,
          quickReplies: ["Preisrechner", "Leistungen", "Kontakt"],
        },
        meta: {
          usedAi: true,
          providerId: provider.id,
          toolNames,
          fallbackReason: finalGuarded.blockedInventedPrice ? "blocked_invented_price" : null,
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
      const exec = executeAllowlistedTool(call.name, call.argumentsJson, {
        fensterPartial: options.fensterPartial ?? session.quote,
        pricingCtx: options.pricingCtx,
      });

      if (exec.customerText) {
        authoritativeText = exec.customerText;
        authorizedEuro = Boolean(exec.emittedEuro);
      }
      if (exec.actionsJson) {
        try {
          actions = JSON.parse(exec.actionsJson) as ConciergeAction[];
        } catch {
          /* keep phone */
        }
      }

      messages.push({
        role: "tool",
        toolCallId: call.id,
        name: call.name,
        content: exec.content,
      });
    }
  }

  const fallbackText =
    authoritativeText ??
    "Bitte nutzen Sie den Preisrechner auf der Website oder rufen Sie uns an — ich helfe Ihnen gern zum richtigen Formular.";

  return {
    reply: {
      text: fallbackText,
      intent: authoritativeText ? "price" : "unknown",
      session: {
        ...session,
        turns: session.turns + 1,
        lastIntent: authoritativeText ? "price" : "unknown",
        stage: "idle",
      },
      actions,
      quickReplies: ["Preisrechner", "Anrufen"],
    },
    meta: {
      usedAi: true,
      providerId: provider.id,
      toolNames,
      fallbackReason: "max_tool_rounds",
    },
  };
}
