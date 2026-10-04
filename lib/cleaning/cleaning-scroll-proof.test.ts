import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("wizard/cleaning scroll hygiene", () => {
  it("scroll helper waits for layout and falls back across engines", () => {
    const src = readFileSync(
      join(root, "components/quote/quote-wizard-scroll.ts"),
      "utf8"
    );
    assert.match(src, /requestAnimationFrame/);
    assert.match(src, /document\.documentElement\.scrollTop/);
    assert.match(src, /behavior:\s*"auto"/);
    assert.match(src, /QUOTE_WIZARD_HEADER_OFFSET\s*=\s*96/);
    assert.match(src, /export function scrollElementIntoViewBelowHeader/);
    assert.match(src, /export function clampWindowScrollToDocument/);
    assert.match(src, /CLEANING_MOBILE_DOCK_OFFSET/);
    assert.match(src, /currentScrollY\(\) \+ delta/);
    assert.match(src, /requestAnimationFrame\(run\)/);
  });

  it("CleaningCalculator anchors only contact/success to root; steps to accordion header", () => {
    const src = readFileSync(
      join(root, "components/cleaning/CleaningCalculator.tsx"),
      "utf8"
    );
    assert.match(src, /openStep === "success" \|\| openStep === "contact"/);
    assert.match(src, /scrollToQuoteWizardTop\(anchorRef\.current\)/);
    assert.match(src, /cleaning-step-\$\{openStep\}-header/);
    assert.match(src, /scrollElementIntoViewBelowHeader\(header\)/);
    assert.match(src, /clampWindowScrollToDocument/);
    assert.match(src, /\[overflow-anchor:none\]/);
    assert.match(src, /data-testid="cleaning-success"/);
    assert.match(src, /id="cleaning-calculator"/);
    // Root re-anchor only for contact/success — not a bare openStep → scrollToTop effect
    const rootAnchors = src.match(/scrollToQuoteWizardTop\(anchorRef\.current\)/g) ?? [];
    assert.equal(rootAnchors.length, 1);
  });

  it("QuoteWizard scrolls on step change with overflow-anchor off", () => {
    const src = readFileSync(join(root, "components/quote/QuoteWizard.tsx"), "utf8");
    assert.match(src, /scrollToQuoteWizardTop\(wizardAnchorRef\.current\)/);
    assert.match(src, /\[step\]/);
    assert.match(src, /\[overflow-anchor:none\]/);
    assert.match(src, /data-testid="quote-wizard"/);
  });

  it("Termin portal re-anchors after success", () => {
    const src = readFileSync(
      join(root, "components/termin/TerminBookingClient.tsx"),
      "utf8"
    );
    assert.match(src, /scrollToQuoteWizardTop\(portalAnchorRef\.current\)/);
    assert.match(src, /\[success\]/);
    assert.match(src, /\[overflow-anchor:none\]/);
  });

  it("cleaning toggles use preventChoiceButtonScroll", () => {
    const accordion = readFileSync(
      join(root, "components/cleaning/CleaningAccordionSection.tsx"),
      "utf8"
    );
    const fields = readFileSync(
      join(root, "components/cleaning/CleaningFields.tsx"),
      "utf8"
    );
    const calc = readFileSync(
      join(root, "components/cleaning/CleaningCalculator.tsx"),
      "utf8"
    );
    assert.match(accordion, /preventChoiceButtonScroll/);
    assert.match(accordion, /\[overflow-anchor:none\]/);
    assert.match(fields, /preventChoiceButtonScroll/);
    assert.match(calc, /cleaning-goto-contact[\s\S]*preventChoiceButtonScroll/);
  });
});
