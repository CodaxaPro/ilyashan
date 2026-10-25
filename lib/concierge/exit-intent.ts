import { getProactivePage } from "./proactive";
import { buildPlaybookCopy } from "./playbooks";
import type { ConciergeSession } from "./types";

export const EXIT_INTENT_KEY = "ilyashan-concierge-exit-seen";

export function shouldShowExitIntent(pathname: string): boolean {
  // Show on sales surfaces + service landings (playbook pages except "other")
  return getProactivePage(pathname) !== "other" || pathname.includes("reinigung") || pathname.includes("gutschein");
}

export function getExitIntentMessage(pathname: string, session?: ConciergeSession): string {
  return buildPlaybookCopy(pathname, session).exit;
}

export function isDesktopPointerFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}
