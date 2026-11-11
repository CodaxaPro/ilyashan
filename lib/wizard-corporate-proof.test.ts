/**
 * Corporate proof: Wizard UX (Step1/3), removed extras, Flügel-Modal, Wintergarten-Form,
 * ObjectType↔Service sync, engine ≡ summary ≡ email ≡ WhatsApp ≡ snapshot.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculatePriceEstimate } from "./pricing";
import {
  buildQuoteTableRowsFromContext,
  getPriceLabelFromContext,
} from "./quote-summary";
import {
  captureQuotePriceSnapshot,
  createQuotePricingContext,
} from "./quote-pricing-context";
import { buildQuoteAdminEmail, buildQuoteCustomerEmail } from "./quote-email";
import { DEFAULT_FENSTER_PRICING } from "./pricing-config";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";
import { siteConfig } from "./config";
import { buildWhatsAppQuoteMessage } from "./whatsapp-quote";
import {
  canProceedQuoteStep,
  normalizeServices,
  syncServicesWithObjectType,
  validateQuoteStep,
} from "./quote-validation";
import { buildLeadQuickReplyLinks } from "./lead-quick-reply";
import { buildAdminNotificationEmail } from "./email";
import { photosToResendAttachments } from "./photo-upload";
import { resolvePriceAudience } from "./vat-display";

const root = process.cwd();
const ctx = createQuotePricingContext(DEFAULT_FENSTER_PRICING);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function quote(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "wohnung",
    floorLevel: "eg",
    elevator: "ja",
    windowCount: 10,
    windowSize: "standard",
    dirtLevel: "normal",
    cleaningSide: "innen_aussen",
    roomHeight: 2.5,
    firstName: "Test",
    lastName: "Kunde",
    phone: "01733828354",
    email: "test@ilyashan.de",
    postalCode: "52499",
    city: "Baesweiler",
    privacyAccepted: true,
    scheduleOption: "1-2_wochen",
    ...overrides,
  };
}

const REMAINING_UI_EXTRAS = [
  "withFrame",
  "withFalz",
  "windowSills",
  "muntinWindows",
  "oldBuildingWindows",
  "skylights",
  "shutters",
] as const;

const REMOVED_FROM_UI = [
  "blinds",
  "canopy",
  "flyScreens",
  "includeSolar",
] as const;

describe("Corporate – Step1 Leistung UX", () => {
  const step1 = read("components/quote/steps/Step1Services.tsx");

  it("has Einmalig + Wartung buttons, no Privat/Gewerbe service cards", () => {
    assert.match(step1, /data-testid="service-einmalig"/);
    assert.match(step1, /data-testid="service-wartung"/);
    assert.doesNotMatch(step1, /data-testid="service-privat"/);
    assert.doesNotMatch(step1, /data-testid="service-gewerbe"/);
    assert.match(step1, /Einmalige Fensterreinigung/);
    assert.match(step1, /Wartungsvertrag \(optional\)/);
  });

  it("defaults to Privat live pricing in form initial state", () => {
    assert.deepEqual(initialQuoteFormData.services, ["privat"]);
    assert.equal(canProceedQuoteStep(1, initialQuoteFormData), true);
  });

  it("normalizeServices never leaves empty primary", () => {
    assert.deepEqual(normalizeServices([]), ["privat"]);
    assert.deepEqual(normalizeServices(["wartung"]), ["privat", "wartung"]);
    assert.deepEqual(normalizeServices(["gewerbe", "wartung"]), ["gewerbe", "wartung"]);
  });
});

describe("Corporate – Step3 extras inventory", () => {
  const step3 = read("components/quote/steps/Step3Details.tsx");

  it("ships only remaining reinigungswünsche keys", () => {
    for (const key of REMAINING_UI_EXTRAS) {
      if (key === "skylights" || key === "shutters") {
        assert.match(step3, new RegExp(`key: "${key}"`));
      } else {
        assert.match(step3, new RegExp(`key: "${key}"`));
      }
    }
    assert.doesNotMatch(step3, /key: "blinds"/);
    assert.doesNotMatch(step3, /key: "canopy"/);
    assert.doesNotMatch(step3, /key: "flyScreens"/);
    assert.doesNotMatch(step3, /Solaranlagen-Reinigung/);
    assert.doesNotMatch(step3, /Jalousien \(innenliegend\)/);
    assert.doesNotMatch(step3, /Vordach \/ Glasdach/);
    assert.doesNotMatch(step3, /Fliegengitter/);
  });

  it("wires Flügel info button + Wintergarten inquiry form", () => {
    assert.match(step3, /FluegelInfoButton/);
    assert.match(step3, /WintergartenInquiryForm/);
    assert.match(step3, /hintAction=\{<FluegelInfoButton/);
  });
});

describe("Corporate – Flügel modal wiring", () => {
  const fluegel = read("components/quote/FluegelExplainer.tsx");
  const step3 = read("components/quote/steps/Step3Details.tsx");

  it("opens via portal to document.body (no nested <p> hydration)", () => {
    assert.match(fluegel, /createPortal/);
    assert.match(fluegel, /document\.body/);
    assert.match(fluegel, /data-testid="fluegel-info-open"/);
    assert.match(fluegel, /data-testid="fluegel-info-modal"/);
    assert.match(fluegel, /Was ist ein Fensterflügel/);
    // hint wrapper must be div when hosting the button
    assert.match(step3, /hint && \(\s*<div className="text-xs text-muted mb-3 flex items-center gap-2">/);
  });
});

describe("Corporate – Wintergarten inquiry form", () => {
  const form = read("components/quote/WintergartenInquiryForm.tsx");

  it("offers E-Mail + WhatsApp channels with brand primary (no neon green CTA)", () => {
    assert.match(form, /wintergarten-channel-\$\{opt\.id\}/);
    assert.match(form, /id: "email"/);
    assert.match(form, /id: "whatsapp"/);
    assert.match(form, /\/api\/contact/);
    assert.match(form, /Wintergarten-Reinigung/);
    assert.match(form, /variant="primary"/);
    assert.doesNotMatch(form, /#25D366/);
    assert.doesNotMatch(form, /mailto:/);
  });

  it("requires name, phone, PLZ, privacy before submit", () => {
    assert.match(form, /wintergarten-name/);
    assert.match(form, /wintergarten-phone/);
    assert.match(form, /wintergarten-plz/);
    assert.match(form, /wintergarten-privacy/);
    assert.match(form, /canSubmit/);
  });
});

describe("Corporate – ObjectType ↔ Service sync", () => {
  it("Gewerbe object flips service label to gewerbe; Wohnung back to privat", () => {
    assert.deepEqual(syncServicesWithObjectType(["privat"], "gewerbe"), ["gewerbe"]);
    assert.deepEqual(syncServicesWithObjectType(["gewerbe", "wartung"], "wohnung"), [
      "privat",
      "wartung",
    ]);
    assert.deepEqual(syncServicesWithObjectType(["privat", "wartung"], "gewerbe"), [
      "gewerbe",
      "wartung",
    ]);
  });

  it("Step2 wires syncServicesWithObjectType on objectType change", () => {
    const step2 = read("components/quote/steps/Step2Object.tsx");
    assert.match(step2, /syncServicesWithObjectType/);
    assert.match(step2, /services: syncServicesWithObjectType/);
  });

  it("Gewebe-Label does not change live price vs Privat", () => {
    const p = quote({ services: ["privat"], objectType: "wohnung", windowCount: 14 });
    const g = quote({ services: ["gewerbe"], objectType: "gewerbe", windowCount: 14 });
    assert.equal(calculatePriceEstimate(p)!.amount, calculatePriceEstimate(g)!.amount);
    assert.equal(resolvePriceAudience(g), "privat");
  });
});

describe("Corporate – remaining extras: engine ≡ surfaces", () => {
  it("each remaining UI extra alone raises the estimate", () => {
    const baseAmt = calculatePriceEstimate(quote())!.amount;
    for (const key of REMAINING_UI_EXTRAS) {
      const patch: Partial<QuoteFormData> =
        key === "skylights"
          ? { skylights: true, skylightsCount: 2 }
          : { [key]: true };
      const amt = calculatePriceEstimate(quote(patch))!.amount;
      assert.ok(amt > baseAmt, `${key} should increase price (${baseAmt} → ${amt})`);
    }
  });

  it("removed UI extras still price if legacy flags set (compat), but UI cannot select them", () => {
    const step3 = read("components/quote/steps/Step3Details.tsx");
    assert.doesNotMatch(step3, /key: "blinds"/);
    assert.doesNotMatch(step3, /key: "canopy"/);
    assert.doesNotMatch(step3, /key: "flyScreens"/);
    assert.doesNotMatch(step3, /includeSolar/);
    const withBlinds = calculatePriceEstimate(quote({ blinds: true }))!;
    assert.ok(withBlinds.breakdown.some((l) => /Jalousien/i.test(l.label)));
  });

  it("large windows hide live €/× hints but keep dirt/extras selectable", () => {
    const step3 = read("components/quote/steps/Step3Details.tsx");
    assert.match(step3, /const showLivePriceHints = !largeWindows/);
    assert.match(step3, /showLivePriceHints && \(/);
    assert.match(step3, /qualitativeExtraHints/);
    assert.match(step3, /individuell nach Foto/i);
  });

  it("wizard ≡ email admin/customer ≡ WhatsApp ≡ snapshot for full remaining-extra quote", () => {
    const data = quote({
      withFrame: true,
      withFalz: true,
      windowSills: true,
      muntinWindows: true,
      oldBuildingWindows: true,
      shutters: true,
      skylights: true,
      skylightsCount: 3,
      narrowStairs: true,
      dirtLevel: "stark",
      cleaningSide: "innen_aussen",
      floorLevel: "og2",
      elevator: "nein",
      windowCount: 12,
    });
    const anfrageNr = "ANG-2026-CORP01";
    const est = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig)!;
    const label = getPriceLabelFromContext(data, ctx);
    const rows = buildQuoteTableRowsFromContext(data, anfrageNr, ctx);
    const priceRow = rows.find(([k]) => k === siteConfig.messaging.priceEstimateRowLabel)?.[1];
    assert.ok(priceRow);
    assert.match(label, new RegExp(String(est.min)));
    assert.match(label, /inkl\. MwSt/);

    const admin = buildQuoteAdminEmail(data, anfrageNr, 2, ctx);
    const customer = buildQuoteCustomerEmail(data, anfrageNr, ctx);
    assert.ok(admin.text.includes(priceRow!));
    assert.ok(customer.text.includes(priceRow!));
    assert.match(admin.html, /Foto/);

    const wa = buildWhatsAppQuoteMessage(data, ctx);
    assert.match(wa, /Flügel|Fenster/i);
    assert.match(wa, new RegExp(String(est.min)));

    const snap = captureQuotePriceSnapshot(data, ctx);
    assert.ok(snap);
    assert.equal(snap!.amount, est.amount);
    assert.equal(snap!.calculatedSubtotal, est.calculatedSubtotal);
  });

  it("large windows: no live price; label + table mark individuelle Anfrage", () => {
    const data = quote({ windowSize: "large" });
    assert.equal(calculatePriceEstimate(data), null);
    assert.match(getPriceLabelFromContext(data, ctx), /Individuell|Anfrage/i);
    const rows = buildQuoteTableRowsFromContext(data, "ANG-LARGE", ctx);
    assert.ok(rows.some(([, v]) => /Größer|individuell|Anfrage/i.test(v)));
    const wa = buildWhatsAppQuoteMessage(data, ctx);
    assert.match(wa, /Fensterflügel/);
    assert.doesNotMatch(wa, /Live-Preisschätzung: ca\./);
  });
});

describe("Corporate – validation matrix Step 1–5", () => {
  it("valid quote passes all steps", () => {
    const data = quote();
    for (let step = 1; step <= 5; step++) {
      assert.equal(canProceedQuoteStep(step, data), true, `step ${step}`);
    }
  });

  it("step 2 blocks missing floor/elevator; step 5 blocks missing phone", () => {
    assert.ok(
      validateQuoteStep(2, quote({ floorLevel: "", elevator: "" })).some(
        (i) => i.field === "floorLevel" || i.field === "elevator"
      )
    );
    assert.ok(validateQuoteStep(5, quote({ phone: "" })).some((i) => i.field === "phone"));
  });

  it("wartung without package blocks step 1", () => {
    assert.equal(
      canProceedQuoteStep(1, quote({ services: ["privat", "wartung"], wartungPackageId: "" })),
      false
    );
  });
});

describe("Corporate – admin / mail ops surfaces", () => {
  it("admin WhatsApp links use api.whatsapp.com + DE phone helper", () => {
    const links = buildLeadQuickReplyLinks({
      name: "Max Mustermann",
      phone: "0173 3828354",
      email: "max@example.com",
      anfrageNr: "ANG-2026-CORP",
      services: "Fensterreinigung",
      festpreis: 149,
      audience: "privat",
    });
    assert.ok(links.whatsappHref?.includes("api.whatsapp.com/send"));
    assert.ok(links.whatsappHref?.includes("phone=491733828354"));
    assert.ok(links.callHref?.startsWith("tel:"));
    assert.ok(links.mailtoHref?.startsWith("mailto:"));
  });

  it("contact admin mail escapes WhatsApp href and includes call CTA", () => {
    const mail = buildAdminNotificationEmail({
      name: "Anna Müller",
      phone: "01733828354",
      email: "anna@example.com",
      plz: "52499",
      service: "Wintergarten-Reinigung",
      message: "Bitte Angebot",
    });
    assert.match(mail.html, /api\.whatsapp\.com\/send\?phone=491733828354&amp;text=/);
    assert.match(mail.html, /Wintergarten/);
    assert.match(mail.subject, /Wintergarten|Anfrage/i);
  });

  it("photo attachments serialize as Buffer with contentType", () => {
    const atts = photosToResendAttachments([
      {
        name: "a.jpg",
        type: "image/jpeg",
        data: Buffer.from("fake").toString("base64"),
      },
    ]);
    assert.equal(atts.length, 1);
    assert.ok(Buffer.isBuffer(atts[0].content));
    assert.equal(atts[0].contentType, "image/jpeg");
  });

  it("admin lead detail + API wire photo gallery helpers", () => {
    const panel = read("components/admin/AdminLeadDetailPanel.tsx");
    const route = read("app/api/admin/leads/[id]/route.ts");
    assert.match(panel, /PhotoPayload/);
    assert.match(panel, /leadPhotos|Foto/i);
    assert.match(route, /getLeadPhotos/);
    assert.match(route, /deleteLeadPhotos/);
  });

  it("admin Anfrage özeti renders all detail rows (no slice truncation)", () => {
    const panel = read("components/admin/AdminLeadDetailPanel.tsx");
    assert.match(panel, /detailRows\.map\(/);
    assert.doesNotMatch(panel, /detailRows\.slice\(/);
    assert.match(panel, /PLZ \/ Ort/);
    assert.match(panel, /admin-lead-detail-rows/);
  });
});

describe("Corporate – messaging consistency", () => {
  it("wizard step1 hint states same live price for Privat and Gewerbe", () => {
    assert.match(siteConfig.messaging.wizardStep1Hint, /Gleicher Live-Preis/);
  });

  it("deploy workflow aliases ilyashan.de after prod deploy", () => {
    const deploy = read(".github/workflows/deploy.yml");
    assert.match(deploy, /vercel alias set .*ilyashan\.de/);
    assert.match(deploy, /www\.ilyashan\.de/);
  });
});
