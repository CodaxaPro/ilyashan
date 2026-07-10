const OUT_OF_SCOPE_PATTERNS = [
  /\b(wetter|weather|fußball|fussball|politik|bitcoin|krypto|rezept|witz|joke)\b/i,
  /\b(arzt|medizin|anwalt|rechtlich|steuerberater)\b/i,
  /\b(iphone|samsung|computer|laptop|programmier)\b/i,
  /\b(restaurant|hotel|urlaub|flug|auto kaufen)\b/i,
];

const IN_SCOPE_HINTS = [
  /fenster/i,
  /flügel|fluegel/i,
  /glas/i,
  /reinigung/i,
  /preis/i,
  /kost/i,
  /angebot/i,
  /baesweiler/i,
  /aachen/i,
  /solar/i,
  /fassade/i,
  /rahmen/i,
  /wartung/i,
  /gewerbe/i,
  /privat/i,
  /termin/i,
  /stock|etage|og\b|eg\b/i,
  /ilyashan/i,
  /versicher/i,
  /anfahrt/i,
  /streifen/i,
  /wizard|rechner/i,
  /hallo|guten|moin|servus|danke/i,
];

export function isOutOfScope(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 3) return false;

  const hasInScope = IN_SCOPE_HINTS.some((p) => p.test(trimmed));
  if (hasInScope) return false;

  return OUT_OF_SCOPE_PATTERNS.some((p) => p.test(trimmed));
}

export const OUT_OF_SCOPE_REPLY =
  "Dazu kann ich leider nicht helfen – ich bin Ihr Assistent ausschließlich für Fensterreinigung bei Ilyashan. Fragen Sie mich gern zu Preisen, Leistungen, Einsatzgebiet oder unserem Preisrechner.";
