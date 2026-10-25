/**
 * Assistant tools (multi-product price routing) — DEFAULT OFF for live safety.
 *
 * Enable only after corporate test suite is green and ops explicitly opts in:
 * ASSISTANT_TOOLS_ENABLED=true
 *
 * When off, the existing Fenster concierge path is unchanged.
 */
export function isAssistantToolsEnabled(): boolean {
  const raw = process.env.ASSISTANT_TOOLS_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
