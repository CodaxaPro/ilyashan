import type { ConciergeIntent } from "./types";
import { isOutOfScope } from "./scope";
import { extractWindowCount } from "./extract";
import { matchFaq } from "./faq-match";

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyIntent(message: string): ConciergeIntent {
  const text = message.trim().toLowerCase();
  if (!text) return "unknown";

  if (isOutOfScope(message)) return "out_of_scope";

  if (matchesAny(text, [/^(hallo|hi|hey|guten|moin|servus|grüß|gruess)/i, /guten tag/, /guten morgen/, /guten abend/])) {
    return "greeting";
  }

  if (matchesAny(text, [/^danke/, /vielen dank/, /super,? danke/, /perfekt,? danke/, /dankeschoen/])) {
    return "thanks";
  }

  if (
    matchesAny(text, [
      /flügel.*zähl/,
      /fluegel.*zaehl/,
      /wie.*flügel/,
      /wie.*fluegel/,
      /was ist ein flügel/,
      /was ist ein fluegel/,
      /flügl/,
      /fenster.*zaehl/,
      /fenster.*zähl/,
    ])
  ) {
    return "fluegel_help";
  }

  const fluegelCount = extractWindowCount(message);
  if (fluegelCount || (/\d/.test(text) && /flügel|fluegel|fenster|fluegl/i.test(text))) {
    return "price_collect";
  }

  if (
    matchesAny(text, [
      /^was kostet/,
      /^wie teuer/,
      /\bpreis\b/,
      /\bpreiß\b/,
      /\bkosten\b/,
      /kalkulier/,
      /berechn/,
      /was kostet das/,
    ])
  ) {
    return "price";
  }

  if (matchFaq(message)) {
    return "faq_match";
  }

  if (
    matchesAny(text, [
      /verbindlich/,
      /festpreis.*angebot/,
      /unterschied.*schätz/,
      /unterschied.*schaetz/,
      /live.*preis/,
      /sofort.*preis/,
      /preisschätzung/,
      /preisschaetzung/,
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
      /wie laeuft/,
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
      /rollladen/,
      /rolladen/,
      /jalousie/,
    ]) &&
    !matchesAny(text, [/preis/, /kost/])
  ) {
    return "service_detail";
  }

  if (matchesAny(text, [/versicher/, /haftpflicht/, /versichert/])) {
    return "insurance";
  }

  if (matchesAny(text, [/winter/, /kalt/, /minus/, /frost/, /kaelte/])) {
    return "winter";
  }

  if (matchesAny(text, [/termin/, /wann.*komm/, /verfügbar/, /verfuegbar/, /dringend/, /schnell/])) {
    return "appointment";
  }

  if (matchesAny(text, [/anruf/, /rückruf/, /rueckruf/, /zurückruf/, /zurueckruf/, /callback/, /persönlich sprechen/, /persoenlich sprechen/, /rückruf anfordern/])) {
    return "callback";
  }

  if (matchesAny(text, [/telefon/, /email/, /e-mail/, /kontakt/, /erreichen/, /whatsapp/])) {
    return "contact";
  }

  if (matchesAny(text, [/wizard/, /formular/, /online.*anfrage/, /preis.*berechnen/, /jetzt starten/])) {
    return "wizard";
  }

  if (/\d/.test(text)) return "price_collect";

  return "unknown";
}

export { findFaqAnswer, matchFaq, suggestFaqForUnknown } from "./faq-match";
