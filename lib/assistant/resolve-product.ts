import type { AssistantToolResult, ProductResolveData } from "./types";
import { calculatorHrefFor, priceDisclosureFor } from "./policy";

type Rule = {
  product: ProductResolveData["product"];
  pattern: RegExp;
  confidence: ProductResolveData["confidence"];
};

const RULES: Rule[] = [
  { product: "treppenhaus", pattern: /treppenhaus|treppen\s*haus|kellerflur|wohneinheit|stockwerke?\b.*wohn/i, confidence: "high" },
  { product: "buero", pattern: /\b(büro|buero|office|teeküche|teekueche|arbeitsplatz)/i, confidence: "high" },
  { product: "praxis", pattern: /\b(praxis|zahnarzt|arztpraxis|physiotherapie)/i, confidence: "high" },
  { product: "bauend", pattern: /\b(bauend|neubau|baureinigung|übergabe.*bau|bau.*übergabe)/i, confidence: "high" },
  { product: "renovierung", pattern: /\b(renovier|nach\s+der\s+maler|nach\s+dem\s+putz)/i, confidence: "high" },
  { product: "entruempelung", pattern: /\b(entrümpel|entruempel|ausräumen|ausraeumen|wohnung\s+leeren)/i, confidence: "high" },
  { product: "gutschein", pattern: /\b(gutschein|geschenk)/i, confidence: "medium" },
  { product: "fenster", pattern: /\b(fenster|flügel|fluegel|glasreinigung|solar|fassade)/i, confidence: "high" },
];

/**
 * Resolve which Ilyashan product a customer message is about.
 * Ambiguous multi-matches → unknown (do not guess a price path).
 */
export function resolveProduct(message: string): AssistantToolResult<ProductResolveData> {
  const text = message.trim();
  if (!text) {
    return {
      ok: false,
      tool: "resolve_product",
      code: "unsupported",
      messageDe: "Bitte beschreiben Sie kurz, welche Reinigung Sie meinen.",
    };
  }

  const hits = RULES.filter((r) => r.pattern.test(text));
  const unique = [...new Map(hits.map((h) => [h.product, h])).values()];

  if (unique.length === 0) {
    return {
      ok: true,
      tool: "resolve_product",
      data: {
        product: "unknown",
        disclosure: priceDisclosureFor("unknown"),
        calculatorHref: null,
        confidence: "low",
      },
    };
  }

  if (unique.length > 1) {
    const hasFensterAndOther =
      unique.some((u) => u.product === "fenster") &&
      unique.some((u) => u.product !== "fenster");
    if (hasFensterAndOther) {
      const other = unique.find((u) => u.product !== "fenster")!;
      return {
        ok: true,
        tool: "resolve_product",
        data: {
          product: other.product,
          disclosure: priceDisclosureFor(other.product),
          calculatorHref: calculatorHrefFor(other.product),
          confidence: "medium",
        },
      };
    }
    return {
      ok: true,
      tool: "resolve_product",
      data: {
        product: "unknown",
        disclosure: priceDisclosureFor("unknown"),
        calculatorHref: null,
        confidence: "low",
      },
    };
  }

  const hit = unique[0]!;
  return {
    ok: true,
    tool: "resolve_product",
    data: {
      product: hit.product,
      disclosure: priceDisclosureFor(hit.product),
      calculatorHref: calculatorHrefFor(hit.product),
      confidence: hit.confidence,
    },
  };
}
