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
  canRunAssistantAi,
  isAssistantAiEnabled,
  isAssistantAiConfigured,
  isAssistantToolsEnabled,
} from "./feature-flag";

export type ProcessConciergeResult = {
  reply: ConciergeReply;
  meta: AiRunMeta;
};

/**
 * Async entry: AI+tools when flags+key ready; else sync classic/tools path.
 * Fail closed — any AI error falls back to deterministic responder.
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

  if (isAssistantAiEnabled()) {
    if (!isAssistantAiConfigured() && !providerOverride) {
      const reply = processConciergeMessage(message, sessionInput, pricingCtx);
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
          const session = sessionInput ?? createSession();
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
          const reply = processConciergeMessage(message, sessionInput, pricingCtx);
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

  const reply = processConciergeMessage(message, sessionInput, pricingCtx);
  return {
    reply,
    meta: {
      ...baseMeta(),
      fallbackReason: isAssistantToolsEnabled() ? "tools_without_ai" : "classic_concierge",
    },
  };
}
