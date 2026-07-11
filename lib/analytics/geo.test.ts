import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeGeoHeader,
  formatCountryName,
  formatRegionName,
  normalizeCityKey,
  resolveServiceArea,
} from "./geo";

describe("analytics geo", () => {
  it("decodes RFC3986 city names", () => {
    assert.equal(decodeGeoHeader("K%C3%B6ln"), "Köln");
    assert.equal(decodeGeoHeader("Aachen"), "Aachen");
    assert.equal(decodeGeoHeader("Baesweiler"), "Baesweiler");
  });

  it("formats country and region names in Turkish", () => {
    assert.equal(formatCountryName("DE"), "Almanya");
    assert.equal(formatRegionName("DE", "NW"), "Kuzey Ren-Vestfalya");
  });

  it("matches core service area cities", () => {
    const result = resolveServiceArea({
      city: "Baesweiler",
      countryCode: "DE",
      regionCode: "NW",
      latitude: null,
      longitude: null,
    });
    assert.equal(result.zone, "core");
    assert.equal(result.inServiceArea, true);
  });

  it("matches Aachen region by coordinates", () => {
    const result = resolveServiceArea({
      city: "Aachen",
      countryCode: "DE",
      regionCode: "NW",
      latitude: 50.776,
      longitude: 6.083,
    });
    assert.equal(result.inServiceArea, true);
    assert.equal(result.zone, "aachen");
  });

  it("marks distant cities outside service area", () => {
    const result = resolveServiceArea({
      city: "Berlin",
      countryCode: "DE",
      regionCode: "BE",
      latitude: 52.52,
      longitude: 13.405,
    });
    assert.equal(result.inServiceArea, false);
    assert.equal(result.zone, "germany_other");
  });

  it("normalizes city keys with umlauts", () => {
    assert.equal(normalizeCityKey("Würselen"), "wurselen");
    assert.equal(normalizeCityKey("Übach-Palenberg"), "ubachpalenberg");
  });
});
