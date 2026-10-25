/**
 * Assistant feature flags — DEFAULT OFF for live customer safety.
 *
 * ASSISTANT_TOOLS_ENABLED=true  → multi-product price policy (no AI)
 * ASSISTANT_AI_ENABLED=true     → AI NLU + tool calls (requires tools + OPENAI_API_KEY)
 *
 * Enable only after corporate proof tests are green and ops opts in.
 */

function envFlagTrue(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function isAssistantToolsEnabled(): boolean {
  return envFlagTrue("ASSISTANT_TOOLS_ENABLED");
}

/** AI requires tools layer; never enable AI alone. */
export function isAssistantAiEnabled(): boolean {
  if (!isAssistantToolsEnabled()) return false;
  return envFlagTrue("ASSISTANT_AI_ENABLED");
}

export function isAssistantAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/** Ready to call a live provider (flag + key). */
export function canRunAssistantAi(): boolean {
  return isAssistantAiEnabled() && isAssistantAiConfigured();
}
