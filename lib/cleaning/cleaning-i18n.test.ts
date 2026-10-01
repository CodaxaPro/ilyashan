import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { t } from "./i18n";
import { calculateOfficeCleaningQuote, FIXTURE_C_500 } from "./index";

describe("cleaning/i18n", () => {
  it("returns DE and TR strings for core keys", () => {
    assert.equal(t("de", "summaryTitle"), "Angebotsübersicht");
    assert.equal(t("tr", "summaryTitle"), "Teklif özeti");
    assert.equal(t("de", "requestQuote"), "Angebot anfordern");
    assert.equal(t("tr", "requestQuote"), "Teklif talep et");
  });

  it("language labels do not affect calculation numbers", () => {
    const de = calculateOfficeCleaningQuote({ ...FIXTURE_C_500, language: "de" });
    const tr = calculateOfficeCleaningQuote({ ...FIXTURE_C_500, language: "tr" });
    assert.equal(de.customer.netCents, tr.customer.netCents);
    assert.equal(t("de", "netPerClean").includes("netto"), true);
    assert.equal(t("tr", "netPerClean").includes("net"), true);
  });
});
