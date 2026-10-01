import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBueroServiceSchema, getServiceSchema } from "@/lib/schema";

describe("cleaning/seo-schema", () => {
  it("Büro schema is distinct from Fenster service schema", () => {
    const buero = getBueroServiceSchema();
    const fenster = getServiceSchema();
    assert.equal(buero.serviceType, "Büroreinigung");
    assert.equal(fenster.serviceType, "Fensterreinigung");
    assert.notEqual(buero.serviceType, fenster.serviceType);
    assert.match(String(buero.url), /bueroreinigung/);
  });
});
