import type { CleaningSide, DirtLevel, FloorLevel, QuoteServiceId } from "@/lib/quote-form";

export function extractWindowCount(text: string): number | null {
  const patterns = [
    /(\d{1,3})\s*(?:fenster)?\s*flügel/i,
    /(\d{1,3})\s*flügel/i,
    /(\d{1,3})\s*fluegel/i,
    /(\d{1,3})\s*f(?:enster)?\b/i,
    /ca\.?\s*(\d{1,3})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= 200) return n;
    }
  }
  return null;
}

export function extractFloorLevel(text: string): FloorLevel | null {
  const lower = text.toLowerCase();
  if (/\b(eg|erdgeschoss|parterre|ground\s*floor)\b/i.test(lower)) return "eg";
  if (/dachgeschoss|\bdg\b|dach\s*geschoss/i.test(lower)) return "dg";
  if (/5\.?\s*(?:og|stock)|fünft|fünfte\s*etage/i.test(lower)) return "og5plus";
  if (/4\.?\s*(?:og|stock)|viert|vierte\s*etage/i.test(lower)) return "og4";
  if (/3\.?\s*(?:og|stock)|dritt|dritte\s*etage/i.test(lower)) return "og3";
  if (/2\.?\s*(?:og|stock)|zweit|zweite\s*etage/i.test(lower)) return "og2";
  if (/1\.?\s*(?:og|stock)|erste\s*etage/i.test(lower)) return "og1";
  return null;
}

export function extractPostalCode(text: string): string | null {
  const match = text.match(/\b(5[0-2]\d{3})\b/);
  return match ? match[1] : null;
}

export function extractService(text: string): QuoteServiceId | null {
  const lower = text.toLowerCase();
  if (/gewerbe|büro|buero|praxis|laden|firma/i.test(lower)) return "gewerbe";
  if (/wartung|vertrag|regelmäßig|monatlich/i.test(lower)) return "wartung";
  if (/privat|wohnung|haus|einfamilien/i.test(lower)) return "privat";
  return null;
}

export function extractCleaningSide(text: string): CleaningSide | null {
  const lower = text.toLowerCase();
  if (/nur\s*außen|nur\s*aussen|outside\s*only/i.test(lower)) return "nur_aussen";
  if (/nur\s*innen|inside\s*only/i.test(lower)) return "nur_innen";
  if (/innen\s*und\s*außen|innen\s*und\s*aussen|beidseitig/i.test(lower)) return "innen_aussen";
  return null;
}

export function extractDirtLevel(text: string): DirtLevel | null {
  const lower = text.toLowerCase();
  if (/extrem|sehr\s*schmutz|bau|renovier/i.test(lower)) return "extrem";
  if (/stark|schmutzig|lange\s*nicht/i.test(lower)) return "stark";
  if (/leicht|wenig|sauber/i.test(lower)) return "leicht";
  if (/normal|mittel/i.test(lower)) return "normal";
  return null;
}

export function extractCityHint(text: string): string | null {
  const cities = [
    "baesweiler",
    "aachen",
    "würselen",
    "wurselen",
    "alsdorf",
    "übach",
    "herzogenrath",
    "eschweiler",
    "stolberg",
    "roetgen",
  ];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) return city;
  }
  return null;
}
