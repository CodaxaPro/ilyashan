import { buildPlaybookCopy, resolvePlaybookPage } from "./playbooks";
import type { ConciergeSession } from "./types";

/** @deprecated Use resolvePlaybookPage — kept for existing imports/tests */
export type ProactivePage = "home" | "angebot" | "other";

export function getProactivePage(pathname: string): ProactivePage {
  const page = resolvePlaybookPage(pathname);
  if (page === "home") return "home";
  if (page === "angebot") return "angebot";
  return "other";
}

export function getProactiveNudge(pathname: string, session?: ConciergeSession): string {
  return buildPlaybookCopy(pathname, session).nudge;
}

export function getProactiveQuickReplies(
  pathname: string,
  session?: ConciergeSession
): string[] {
  return buildPlaybookCopy(pathname, session).quickReplies;
}

export const PROACTIVE_DELAY_MS = 25_000;
