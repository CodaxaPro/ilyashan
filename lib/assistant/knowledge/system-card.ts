/**
 * Single source of truth for the assistant — built from live site config + pricing engines.
 * The model does not "guess" the company; it reads this card (prompt + tool).
 */
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { TREPPENHAUS_PRICING } from "@/lib/treppenhaus/pricing";
import {
  CALCULATOR_REQUIRED_DISCLAIMER_DE,
  MANUAL_PRICE_DISCLAIMER_DE,
  ORIENTIERUNG_DISCLAIMER_DE,
  calculatorHrefFor,
  priceDisclosureFor,
} from "../policy";
import type { AssistantProductLine } from "../types";

const PRODUCT_LINES: AssistantProductLine[] = [
  "fenster",
  "buero",
  "treppenhaus",
  "praxis",
  "bauend",
  "renovierung",
  "entruempelung",
  "gutschein",
];

export type SystemKnowledgeTopic =
  | "overview"
  | "products"
  | "treppenhaus"
  | "process"
  | "area"
  | "contact";

/**
 * Compact card injected into every AI turn — always "knows" Ilyashan.
 */
export function buildSystemKnowledgeOverview(): Record<string, unknown> {
  return {
    company: siteConfig.name,
    region: siteConfig.contact.region,
    address: `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}`,
    phone: siteConfig.contact.phoneDisplay,
    email: siteConfig.contact.email,
    responseTime: siteConfig.business.responseTime,
    rating: `${siteConfig.business.rating}/5 (${siteConfig.business.reviews} Reviews)`,
    usps: siteConfig.usps.map((u) => u.title),
    noTravelFee: siteConfig.serviceArea.noTravelFeeLabel,
    pricingRules: {
      orientierungVsFestpreis: ORIENTIERUNG_DISCLAIMER_DE,
      neverInventEuro: true,
      euroOnlyFromTools: true,
      afterOnlineQuote: "Name+Telefon im Chat → CRM-Lead → Festpreis nach Prüfung",
    },
    products: PRODUCT_LINES.map((id) => ({
      id,
      disclosure: priceDisclosureFor(id),
      calculatorOrForm: calculatorHrefFor(id),
      chatLiveCalc: id === "treppenhaus" || id === "fenster",
    })),
    tools: {
      get_system_knowledge: "Liest dieses Firmensystem (Produkte, Gebiet, Prozess, Treppenhaus-Motor).",
      upsert_treppenhaus_fields: "Treppenhaus rechnen — einziger Weg zu Treppenhaus-€.",
      get_price_guidance: "Allgemeine Preisfrage / Preisliste.",
      resolve_product: "Leistung erkennen.",
    },
  };
}

export function buildSystemKnowledgeDetail(topic: SystemKnowledgeTopic): Record<string, unknown> {
  switch (topic) {
    case "products":
      return {
        topic: "products",
        websiteServices: siteConfig.services.map((s) => ({
          id: s.id,
          title: s.title,
          priceFromLabel: s.priceFrom,
          description: s.description,
        })),
        assistantLines: PRODUCT_LINES.map((id) => ({
          id,
          disclosure: priceDisclosureFor(id),
          href: calculatorHrefFor(id),
          howToPriceInChat:
            id === "treppenhaus"
              ? "upsert_treppenhaus_fields (Stockwerke, Wohnungen, Turnus, …) → calculateTreppenhausQuote"
              : id === "fenster"
                ? "get_price_guidance / Fenster-Rechner; Flügel+Etage"
                : id === "buero"
                  ? "Büro-Rechner / Anfrage — kein freier €-Text"
                  : MANUAL_PRICE_DISCLAIMER_DE,
        })),
        disclaimers: {
          orientierung: ORIENTIERUNG_DISCLAIMER_DE,
          calculator: CALCULATOR_REQUIRED_DISCLAIMER_DE,
          manual: MANUAL_PRICE_DISCLAIMER_DE,
        },
      };

    case "treppenhaus":
      return {
        topic: "treppenhaus",
        engine: "calculateTreppenhausQuote",
        calculatorUrl: routes.treppenhausreinigungAngebot,
        requiredFields: [
          "stockwerke (1–12, EG mitgezählt)",
          "wohnungen (1–40)",
          "stairTurnus: weekly | biweekly | monthly",
          "dirtLevel: normal | medium | heavy",
          "keller: boolean (+ kellerTurnus wenn ja)",
        ],
        optionalFields: ["aufzug", "glasHandlauf"],
        /** Factors from live engine config — model may explain, must not invent final € */
        engineConfig: {
          baseVisitEuro: TREPPENHAUS_PRICING.baseVisitEuro,
          perStockwerkEuro: TREPPENHAUS_PRICING.perStockwerkEuro,
          perWohnungEuro: TREPPENHAUS_PRICING.perWohnungEuro,
          kellerVisitEuro: TREPPENHAUS_PRICING.kellerVisitEuro,
          aufzugVisitEuro: TREPPENHAUS_PRICING.aufzugVisitEuro,
          glasVisitEuro: TREPPENHAUS_PRICING.glasVisitEuro,
          minMonthlyNetEuro: TREPPENHAUS_PRICING.minMonthlyNetEuro,
          vatRate: TREPPENHAUS_PRICING.vatRate,
          weeklyPackageFactor: TREPPENHAUS_PRICING.weeklyPackageFactor,
          dirtFactors: TREPPENHAUS_PRICING.dirtFactors,
          visitsPerMonth: TREPPENHAUS_PRICING.visitsPerMonth,
        },
        rule: "Endbetrag NUR über upsert_treppenhaus_fields / Tool-Antwort. Faktoren erklären ok, Monatspreis selbst ausrechnen verboten.",
      };

    case "process":
      return {
        topic: "process",
        steps: siteConfig.process.map((p) => ({
          step: p.step,
          title: p.title,
          description: p.description,
        })),
        chatClose: [
          "1. Orientierung im Chat (Tool/Motor)",
          "2. Kunde hinterlässt Name + Telefon (Hot-Lead-Formular)",
          "3. Lead in Admin/CRM + E-Mail",
          `4. Verbindliches Festpreis-Angebot in ca. ${siteConfig.business.responseTime}`,
        ],
      };

    case "area":
      return {
        topic: "area",
        headline: siteConfig.serviceArea.headline,
        noTravelFee: siteConfig.serviceArea.noTravelFeeLabel,
        regions: siteConfig.serviceArea.regions,
      };

    case "contact":
      return {
        topic: "contact",
        phone: siteConfig.contact.phoneDisplay,
        email: siteConfig.contact.email,
        whatsapp: siteConfig.contact.whatsapp,
        address: `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}`,
      };

    case "overview":
    default:
      return buildSystemKnowledgeOverview();
  }
}

/** Plain-text block for system prompt (always present). */
export function formatSystemKnowledgeForPrompt(): string {
  const o = buildSystemKnowledgeOverview();
  return `
SYSTEMWISSEN (live aus Code/Config — nicht raten):
${JSON.stringify(o, null, 0)}

Bei Detailfragen Tool get_system_knowledge mit topic=products|treppenhaus|process|area|contact aufrufen.
`;
}
