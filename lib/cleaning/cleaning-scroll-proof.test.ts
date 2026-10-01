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
  });

  it("CleaningCalculator re-anchors on openStep including success", () => {
    const src = readFileSync(
      join(root, "components/cleaning/CleaningCalculator.tsx"),
      "utf8"
    );
    assert.match(src, /scrollToQuoteWizardTop\(anchorRef\.current\)/);
    assert.match(src, /\[openStep\]/);
    assert.match(src, /data-testid="cleaning-success"/);
    assert.match(src, /id="cleaning-calculator"/);
  });

  it("QuoteWizard still scrolls on step change", () => {
    const src = readFileSync(join(root, "components/quote/QuoteWizard.tsx"), "utf8");
    assert.match(src, /scrollToQuoteWizardTop\(wizardAnchorRef\.current\)/);
    assert.match(src, /\[step\]/);
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
    assert.match(accordion, /preventChoiceButtonScroll/);
    assert.match(fields, /preventChoiceButtonScroll/);
  });
});
