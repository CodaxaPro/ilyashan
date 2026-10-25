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

function treppenhausReply(
  session: ConciergeSession,
  message: string
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
      fallbackReason: d.complete ? "treppenhaus_quote" : "treppenhaus_collect",
    },
  };
}

/**
 * Async entry:
 * 1) Treppenhaus live dialog (deterministic, engine-backed) when tools on
 * 2) AI+tools when flags+key ready
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

  // Human Q&A calculation for Treppenhaus — highest priority when tools enabled
  if (isAssistantToolsEnabled() && shouldHandleTreppenhausDialog(session, message)) {
    return treppenhausReply(session, message);
  }

  if (isAssistantAiEnabled()) {
    if (!isAssistantAiConfigured() && !providerOverride) {
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
          const result = await runAssistantAi({
            message,
            session,
            provider,
            fensterPartial: session.quote,
            pricingCtx,
          });
          return result;
        } catch (error) {
          console.error("[assistant-ai] fallback to deterministic:", error);
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

  const reply = processConciergeMessage(message, session, pricingCtx);
  return {
    reply,
    meta: {
      ...baseMeta(),
      fallbackReason: isAssistantToolsEnabled() ? "tools_without_ai" : "classic_concierge",
    },
  };
}
