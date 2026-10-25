import type { ConciergeReply, ConciergeSession } from "@/lib/concierge/types";
import { createSession } from "@/lib/concierge/types";
import { processConciergeMessage } from "@/lib/concierge/responder";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { createOpenAiProviderFromEnv } from "./ai/openai-provider";
import { runAssistantAi } from "./ai/run";
import type { AiProvider, AiRunMeta } from "./ai/types";
import {
  advanceTreppenhausDialog,
  shouldHandleTreppenhausDialog,
} from "./dialog/treppenhaus";
import {
  canRunAssistantAi,
  isAssistantAiEnabled,
  isAssistantAiConfigured,
  isAssistantToolsEnabled,
} from "./feature-flag";

export type ProcessConciergeResult = {
  reply: ConciergeReply;
  meta: AiRunMeta;
};

function treppenhausFallbackReply(
  session: ConciergeSession,
  message: string,
  reason: string
): ProcessConciergeResult {
  const d = advanceTreppenhausDialog(session, message);
  return {
    reply: {
      text: d.text,
      intent: "price",
      session: d.session,
      actions: d.actions,
      quickReplies: d.quickReplies,
    },
    meta: {
      usedAi: false,
      providerId: null,
      toolNames: ["advance_treppenhaus_dialog"],
      fallbackReason: d.complete ? "treppenhaus_quote" : reason,
    },
  };
}

/**
 * Async entry (enterprise):
 * 1) AI + tools when ready — AI understands language; engines own €
 * 2) Deterministic Treppenhaus dialog if tools on but AI unavailable
 * 3) Classic concierge
 */
export async function processConciergeMessageAsync(
  message: string,
  sessionInput?: ConciergeSession,
  pricingCtx: QuotePricingContext = defaultQuotePricingContext(),
  providerOverride?: AiProvider | null
): Promise<ProcessConciergeResult> {
  const baseMeta = (): AiRunMeta => ({
    usedAi: false,
    providerId: null,
    toolNames: [],
    fallbackReason: null,
  });

  const session = sessionInput ?? createSession();
  const treppenhausCtx =
    isAssistantToolsEnabled() && shouldHandleTreppenhausDialog(session, message);

  if (isAssistantAiEnabled()) {
    if (!isAssistantAiConfigured() && !providerOverride) {
      if (treppenhausCtx) {
        return treppenhausFallbackReply(session, message, "treppenhaus_collect");
      }
      const reply = processConciergeMessage(message, session, pricingCtx);
      return {
        reply,
        meta: {
          ...baseMeta(),
          fallbackReason: "ai_enabled_but_no_api_key",
        },
      };
    }

    if (canRunAssistantAi() || providerOverride) {
      const provider = providerOverride ?? createOpenAiProviderFromEnv();
      if (provider) {
        try {
          return await runAssistantAi({
            message,
            session,
            provider,
            fensterPartial: session.quote,
            pricingCtx,
          });
        } catch (error) {
          console.error("[assistant-ai] fallback:", error);
          if (treppenhausCtx) {
            return treppenhausFallbackReply(session, message, "treppenhaus_collect");
          }
          const reply = processConciergeMessage(message, session, pricingCtx);
          return {
            reply,
            meta: {
              ...baseMeta(),
              fallbackReason: "ai_runtime_error",
            },
          };
        }
      }
    }
  }

  // Tools on, AI off → still offer live Treppenhaus engine dialog
  if (treppenhausCtx) {
    return treppenhausFallbackReply(session, message, "treppenhaus_collect");
  }

  const reply = processConciergeMessage(message, session, pricingCtx);
  return {
    reply,
    meta: {
      ...baseMeta(),
      fallbackReason: isAssistantToolsEnabled() ? "tools_without_ai" : "classic_concierge",
    },
  };
}
