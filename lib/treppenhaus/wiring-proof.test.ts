/**
 * Wiring proof — routes, service page content, calculator module and home card.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { routes } from "../routes";
import { companyServices } from "../company-services";
import { servicePages } from "../service-pages";

const root = join(import.meta.dirname, "../..");

describe("treppenhaus/wiring proof", () => {
  it("exposes DE routes for hub + calculator", () => {
    assert.equal(routes.treppenhausreinigung, "/de/treppenhausreinigung");
    assert.equal(routes.treppenhausreinigungAngebot, "/de/treppenhausreinigung/angebot");
  });

  it("registers company service card with calculator CTA", () => {
    const card = companyServices.find((s) => s.href === routes.treppenhausreinigung);
    assert.ok(card);
    assert.equal(card!.title, "Treppenhausreinigung");
    assert.equal(card!.nextHref, routes.treppenhausreinigungAngebot);
    assert.equal(card!.nextLabel, "Preis kalkulieren");
  });

  it("service page content is unique and points to calculator + Anfrage", () => {
    const page = servicePages.treppenhaus;
    assert.equal(page.serviceKey, "treppenhausreinigung");
    assert.equal(page.path, "/treppenhausreinigung");
    assert.equal(page.primaryHref, routes.treppenhausreinigungAngebot);
    assert.ok(page.includes.some((line) => /Keller/i.test(line)));
    assert.ok(page.faq.some((item) => /Keller/i.test(item.q)));
    assert.ok(page.title.length > 10);
    assert.notEqual(page.title, page.name);
  });

  it("App Router pages and calculator module exist", () => {
    const files = [
      "app/treppenhausreinigung/page.tsx",
      "app/treppenhausreinigung/angebot/page.tsx",
      "components/treppenhaus/TreppenhausCalculator.tsx",
      "lib/treppenhaus/pricing.ts",
    ];
    for (const file of files) {
      assert.ok(existsSync(join(root, file)), `missing ${file}`);
    }
  });

  it("sitemap lists both Treppenhaus URLs", () => {
    const sitemap = readFileSync(join(root, "app/sitemap.ts"), "utf8");
    assert.match(sitemap, /treppenhausreinigung/);
    assert.match(sitemap, /treppenhausreinigung\/angebot/);
  });

  it("ContactForm steers Treppenhaus to calculator (no thin contact option)", () => {
    const form = readFileSync(join(root, "components/ContactForm.tsx"), "utf8");
    assert.match(form, /treppenhausreinigungAngebot/);
    assert.doesNotMatch(form, /value:\s*"treppenhausreinigung"/);
    const contactApi = readFileSync(join(root, "app/api/contact/route.ts"), "utf8");
    assert.match(contactApi, /calculatorOnly/);
    assert.match(contactApi, /treppenhausreinigung/);
  });

  it("calculator enforces Keller sync UX copy + allowed options API", () => {
    const ui = readFileSync(join(root, "components/treppenhaus/TreppenhausCalculator.tsx"), "utf8");
    assert.match(ui, /allowedKellerTurnus/);
    assert.match(ui, /syncKellerTurnus/);
    assert.match(ui, /Monatlich/);
    assert.match(ui, /Keller/);
  });
});
