import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractWindowCount,
  extractFloorLevel,
  extractPostalCode,
  extractService,
  extractCleaningSide,
} from "./concierge/extract";

describe("concierge extract", () => {
  it("extracts Flügel count", () => {
    assert.equal(extractWindowCount("12 Flügel"), 12);
    assert.equal(extractWindowCount("10 fenster"), 10);
    assert.equal(extractWindowCount("ca. 8"), 8);
    assert.equal(extractWindowCount("hallo"), null);
  });

  it("extracts floor level", () => {
    assert.equal(extractFloorLevel("2. Stock"), "og2");
    assert.equal(extractFloorLevel("Erdgeschoss"), "eg");
    assert.equal(extractFloorLevel("3. OG"), "og3");
    assert.equal(extractFloorLevel("Dachgeschoss"), "dg");
  });

  it("extracts PLZ", () => {
    assert.equal(extractPostalCode("52499 Baesweiler"), "52499");
    assert.equal(extractPostalCode("52062"), "52062");
  });

  it("extracts service type", () => {
    assert.equal(extractService("Gewerbe Büro"), "gewerbe");
    assert.equal(extractService("Wartungsvertrag"), "wartung");
    assert.equal(extractService("Privat Wohnung"), "privat");
  });

  it("extracts cleaning side", () => {
    assert.equal(extractCleaningSide("nur außen"), "nur_aussen");
    assert.equal(extractCleaningSide("innen und außen"), "innen_aussen");
  });
});
