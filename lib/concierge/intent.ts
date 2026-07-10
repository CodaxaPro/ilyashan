import type { ConciergeIntent } from "./types";
import { isOutOfScope } from "./scope";
import { siteConfig } from "@/lib/config";
import { extractWindowCount } from "./extract";

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyIntent(message: string): ConciergeIntent {
  const text = message.trim().toLowerCase();
  if (!text) return "unknown";

  if (isOutOfScope(message)) return "out_of_scope";

  if (matchesAny(text, [/^(hallo|hi|hey|guten|moin|servus|grüß)/i, /guten tag/, /guten morgen/, /guten abend/])) {
    return "greeting";
  }

  if (matchesAny(text, [/^danke/, /vielen dank/, /super,? danke/, /perfekt,? danke/])) {
    return "thanks";
  }

  if (matchesAny(text, [/flügel.*zähl/, /wie.*flügel/, /was ist ein flügel/, /fluegel.*zaehl/])) {
    return "fluegel_help";
  }

  const fluegelCount = extractWindowCount(message);
  if (fluegelCount || (/\d/.test(text) && /flügel|fluegel|fenster/i.test(text))) {
    return "price_collect";
  }

  if (matchesAny(text, [/^was kostet/, /^wie teuer/, /\bpreis\b/, /\bkosten\b/, /kalkulier/, /berechn/])) {
    return "price";
  }

  if (
    matchesAny(text, [
      /verbindlich/,
      /festpreis.*angebot/,
      /unterschied.*schätz/,
      /live.*preis/,
      /sofort.*preis/,
      /preisschätzung/,
    ])
  ) {
    return "festpreis_info";
  }

  if (
    matchesAny(text, [
      /ablauf/,
      /wie funktioniert/,
      /wizard/,
      /preisrechner/,
      /schritte/,
      /wie läuft/,
      /wie geht das/,
    ])
  ) {
    return "process";
  }

  if (
    matchesAny(text, [
      /einsatzgebiet/,
      /anfahrt/,
      /anfahrtskosten/,
      /wo.*reinigen/,
      /kommen sie nach/,
      /gebiet/,
      /aachen/,
      /baesweiler/,
      /plz/,
      /postleitzahl/,
    ])
  ) {
    return "area";
  }

  if (
    matchesAny(text, [
      /angebot.*preis/,
      /€|euro/,
    ])
  ) {
    return "price";
  }

  if (matchesAny(text, [/leistung/, /was bieten/, /welche service/, /angebot.*leistung/, /was macht ihr/])) {
    return "services";
  }

  if (
    matchesAny(text, [
      /privat/,
      /gewerbe/,
      /solar/,
      /fassade/,
      /rahmen/,
      /wartung/,
      /wintergarten/,
    ]) &&
    !matchesAny(text, [/preis/, /kost/])
  ) {
    return "service_detail";
  }

  if (matchesAny(text, [/versicher/, /haftpflicht/, /versichert/])) {
    return "insurance";
  }

  if (matchesAny(text, [/winter/, /kalt/, /minus/, /frost/])) {
    return "winter";
  }

  if (matchesAny(text, [/termin/, /wann.*komm/, /verfügbar/, /dringend/, /schnell/])) {
    return "appointment";
  }

  if (matchesAny(text, [/anruf/, /rückruf/, /zurückruf/, /callback/, /persönlich sprechen/, /rückruf anfordern/])) {
    return "callback";
  }

  if (matchesAny(text, [/telefon/, /email/, /e-mail/, /kontakt/, /erreichen/, /whatsapp/])) {
    return "contact";
  }

  if (matchesAny(text, [/wizard/, /formular/, /online.*anfrage/, /preis.*berechnen/, /jetzt starten/])) {
    return "wizard";
  }

  for (const item of siteConfig.faq) {
    const q = item.question.toLowerCase();
    const keywords = q.split(/\s+/).filter((w) => w.length > 4);
    const hits = keywords.filter((k) => text.includes(k)).length;
    if (hits >= 2 || text.includes(q.slice(0, 20))) {
      return "faq_match";
    }
  }

  if (/\d/.test(text)) return "price_collect";

  return "unknown";
}

export function findFaqAnswer(message: string): string | null {
  const text = message.trim().toLowerCase();
  let best: { score: number; answer: string } | null = null;

  for (const item of siteConfig.faq) {
    const words = item.question
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const score = words.filter((w) => text.includes(w)).length;
    if (score >= 2 && (!best || score > best.score)) {
      best = { score, answer: item.answer };
    }
  }
  return best?.answer ?? null;
}
