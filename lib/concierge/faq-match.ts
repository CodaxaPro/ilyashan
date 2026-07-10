import { siteConfig } from "@/lib/config";
import { fuzzyWordMatch, normalizeConciergeText, tokenizeConciergeText } from "./fuzzy";

export type FaqMatchMethod = "alias" | "keyword" | "fuzzy";

export interface FaqMatchResult {
  id: string;
  question: string;
  answer: string;
  score: number;
  method: FaqMatchMethod;
}

const STOP_WORDS = new Set([
  "was",
  "wie",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einer",
  "einem",
  "einen",
  "und",
  "oder",
  "fuer",
  "für",
  "bei",
  "mit",
  "sie",
  "ihr",
  "uns",
  "auch",
  "noch",
  "gibt",
  "haben",
  "kann",
  "muss",
  "sind",
  "ist",
  "werden",
  "wird",
]);

function significantWords(text: string): string[] {
  return tokenizeConciergeText(text).filter((word) => !STOP_WORDS.has(word) && word.length >= 4);
}

function aliasScore(normalizedMessage: string, alias: string): number {
  const normalizedAlias = normalizeConciergeText(alias);
  if (!normalizedAlias) return 0;
  if (normalizedMessage.includes(normalizedAlias)) return 12 + normalizedAlias.length / 10;
  return 0;
}

function keywordScore(normalizedMessage: string, question: string): number {
  const words = significantWords(question);
  if (words.length === 0) return 0;

  let hits = 0;
  for (const word of words) {
    if (normalizedMessage.includes(word)) hits += 1;
  }

  if (hits >= 2) return hits * 3;
  if (hits === 1 && words.length <= 2) return 2;
  return 0;
}

function fuzzyScore(normalizedMessage: string, corpus: string): number {
  const messageTokens = tokenizeConciergeText(normalizedMessage);
  const corpusTokens = significantWords(corpus);
  if (messageTokens.length === 0 || corpusTokens.length === 0) return 0;

  let hits = 0;
  for (const token of messageTokens) {
    if (token.length < 4) continue;
    if (corpusTokens.some((candidate) => fuzzyWordMatch(token, candidate))) {
      hits += 1;
    }
  }

  if (hits >= 2) return hits * 2.5;
  if (hits === 1 && messageTokens.length <= 3) return 2;
  return 0;
}

export function matchFaq(
  message: string,
  options: { minScore?: number } = {}
): FaqMatchResult | null {
  const minScore = options.minScore ?? 4;
  const normalizedMessage = normalizeConciergeText(message);
  if (!normalizedMessage) return null;

  let best: FaqMatchResult | null = null;

  for (const item of siteConfig.faq) {
    const candidates: Array<{ score: number; method: FaqMatchMethod }> = [];

    const keyword = keywordScore(normalizedMessage, item.question);
    if (keyword > 0) candidates.push({ score: keyword, method: "keyword" });

    const fuzzyQuestion = fuzzyScore(normalizedMessage, item.question);
    if (fuzzyQuestion > 0) candidates.push({ score: fuzzyQuestion, method: "fuzzy" });

    for (const alias of item.aliases ?? []) {
      const score = aliasScore(normalizedMessage, alias);
      if (score > 0) candidates.push({ score, method: "alias" });

      const fuzzyAlias = fuzzyScore(normalizedMessage, alias);
      if (fuzzyAlias > 0) candidates.push({ score: fuzzyAlias, method: "fuzzy" });
    }

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0];

    if (top.score >= minScore && (!best || top.score > best.score)) {
      best = {
        id: item.id,
        question: item.question,
        answer: item.answer,
        score: top.score,
        method: top.method,
      };
    }
  }

  return best;
}

export function findFaqAnswer(message: string): string | null {
  return matchFaq(message)?.answer ?? null;
}

export function suggestFaqForUnknown(message: string): FaqMatchResult | null {
  return matchFaq(message, { minScore: 2 });
}
