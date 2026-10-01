import type { MouseEvent } from "react";

/** Fixed sticky header offset when scrolling calculators / wizards into view */
export const QUOTE_WIZARD_HEADER_OFFSET = 96;

function currentScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function setScrollY(y: number) {
  const top = Math.max(0, Math.round(y));
  try {
    window.scrollTo({ top, left: 0, behavior: "auto" });
  } catch {
    // Older WebKit / restricted contexts
    window.scrollTo(0, top);
  }
  // Sync documentElement for engines that ignore window.scrollTo alone
  if (document.documentElement) {
    document.documentElement.scrollTop = top;
  }
  if (document.body) {
    document.body.scrollTop = top;
  }
}

/**
 * Scroll so `anchor` sits just below the sticky header.
 * Double-rAF waits for layout collapse (e.g. success state replaces a tall form)
 * so desktop/mobile/Safari do not leave the user parked in the footer.
 */
export function scrollToQuoteWizardTop(anchor: HTMLElement | null) {
  if (!anchor || typeof window === "undefined") return;

  const run = () => {
    const top =
      anchor.getBoundingClientRect().top + currentScrollY() - QUOTE_WIZARD_HEADER_OFFSET;
    setScrollY(top);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/** Prevents scroll jump when tapping toggle buttons inside long steps */
export function preventChoiceButtonScroll(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}
