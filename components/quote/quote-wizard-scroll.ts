import type { MouseEvent } from "react";

/** Fixed sticky header offset when scrolling calculators / wizards into view */
export const QUOTE_WIZARD_HEADER_OFFSET = 96;

/** Mobile sticky price dock — keep accordion targets clear of it */
export const CLEANING_MOBILE_DOCK_OFFSET = 96;

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

function afterLayout(run: () => void) {
  // Accordion open/close changes height; one frame is not enough — correct twice.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
  });
}

/**
 * Scroll so `anchor` sits just below the sticky header.
 * Double-pass after layout so success/contact collapse does not park in the footer.
 */
export function scrollToQuoteWizardTop(anchor: HTMLElement | null) {
  if (!anchor || typeof window === "undefined") return;

  const run = () => {
    const delta = anchor.getBoundingClientRect().top - QUOTE_WIZARD_HEADER_OFFSET;
    if (Math.abs(delta) < 2) return;
    setScrollY(currentScrollY() + delta);
  };

  afterLayout(run);
}

/**
 * Keep a step header in the comfortable viewport (below sticky header, above mobile dock).
 * Uses delta correction after accordion height settles — avoids overshoot into negative tops.
 */
export function scrollElementIntoViewBelowHeader(
  el: HTMLElement | null,
  options?: { force?: boolean; bottomInset?: number }
) {
  if (!el || typeof window === "undefined") return;

  const bottomInset = options?.bottomInset ?? CLEANING_MOBILE_DOCK_OFFSET;

  const run = () => {
    const rect = el.getBoundingClientRect();
    const header = QUOTE_WIZARD_HEADER_OFFSET;
    const alreadyVisible =
      rect.top >= header - 8 &&
      rect.top <= window.innerHeight - bottomInset - 40 &&
      rect.bottom > header;
    if (alreadyVisible && !options?.force) return;

    const delta = rect.top - header;
    if (Math.abs(delta) < 2) return;
    setScrollY(currentScrollY() + delta);
  };

  afterLayout(run);
}

/** After accordion collapse, clamp scroll so empty footer space is not shown. */
export function clampWindowScrollToDocument() {
  if (typeof window === "undefined") return;
  const doc = document.documentElement;
  const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
  if (currentScrollY() > maxScroll + 1) {
    setScrollY(maxScroll);
  }
}

/** Prevents scroll jump when tapping toggle buttons inside long steps */
export function preventChoiceButtonScroll(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}
