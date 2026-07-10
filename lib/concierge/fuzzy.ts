/** Normalize German user text for matching (typos, umlauts, punctuation). */
export function normalizeConciergeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeConciergeText(text: string): string[] {
  return normalizeConciergeText(text)
    .split(" ")
    .filter((token) => token.length >= 3);
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function fuzzyWordMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;

  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  const ratio = 1 - distance / maxLen;

  if (a.length <= 5 || b.length <= 5) return distance <= 1;
  return ratio >= 0.82 || distance <= 2;
}

export function messageFingerprint(text: string): string {
  return normalizeConciergeText(text).slice(0, 160);
}
