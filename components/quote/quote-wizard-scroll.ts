import type { MouseEvent } from "react";

/** Fixed header offset when scrolling wizard into view */
export const QUOTE_WIZARD_HEADER_OFFSET = 96;

export function scrollToQuoteWizardTop(anchor: HTMLElement | null) {
  if (!anchor) return;

  const top =
    anchor.getBoundingClientRect().top + window.scrollY - QUOTE_WIZARD_HEADER_OFFSET;

  window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
}

/** Prevents scroll jump when tapping toggle buttons inside long steps */
export function preventChoiceButtonScroll(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}
