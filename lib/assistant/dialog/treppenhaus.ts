/**
 * Conversational Treppenhaus quote — human Q&A, engine-backed € only.
 */
import { phoneAction } from "@/lib/concierge/knowledge";
import type { ConciergeAction, ConciergeSession } from "@/lib/concierge/types";
import { routes } from "@/lib/routes";
import {
  allowedKellerTurnus,
  calculateTreppenhausQuote,
  formatEuroFromCents,
  syncKellerTurnus,
  type DirtLevel,
  type StairTurnus,
  type TreppenhausInput,
} from "@/lib/treppenhaus/pricing";
import { ORIENTIERUNG_DISCLAIMER_DE } from "../policy";

export type TreppenhausDraft = Partial<TreppenhausInput>;

export type TreppenhausDialogResult = {
  session: ConciergeSession;
  text: string;
  actions: ConciergeAction[];
  quickReplies: string[];
  emittedEuro: boolean;
  complete: boolean;
};

const TURNUS_LABEL: Record<StairTurnus, string> = {
  weekly: "wöchentlich",
  biweekly: "alle 14 Tage",
  monthly: "monatlich",
};

const DIRT_LABEL: Record<DirtLevel, string> = {
  normal: "normal",
  medium: "erhöht",
  heavy: "stark",
};

export function getTreppenhausDraft(session: ConciergeSession): TreppenhausDraft {
  return session.treppenhausDraft ?? {};
}

export function withTreppenhausDraft(
  session: ConciergeSession,
  draft: TreppenhausDraft
): ConciergeSession {
  return {
    ...session,
    assistantProduct: "treppenhaus",
    treppenhausDraft: draft,
    stage: "idle",
    lastIntent: "price",
  };
}

export function missingTreppenhausFields(draft: TreppenhausDraft): (keyof TreppenhausInput)[] {
  const missing: (keyof TreppenhausInput)[] = [];
  if (!draft.stockwerke || draft.stockwerke < 1) missing.push("stockwerke");
  if (!draft.wohnungen || draft.wohnungen < 1) missing.push("wohnungen");
  if (!draft.stairTurnus) missing.push("stairTurnus");
  if (!draft.dirtLevel) missing.push("dirtLevel");
  if (draft.keller === undefined) missing.push("keller");
  if (draft.keller === true && !draft.kellerTurnus) missing.push("kellerTurnus");
  return missing;
}

export function isTreppenhausComplete(draft: TreppenhausDraft): draft is TreppenhausInput {
  return missingTreppenhausFields(draft).length === 0;
}

function link(label: string, href: string): ConciergeAction {
  return { type: "link", label, href };
}

function askNext(draft: TreppenhausDraft): { text: string; quickReplies: string[] } {
  const missing = missingTreppenhausFields(draft);
  const next = missing[0];
  if (next === "stockwerke") {
    return {
      text: "Gerne kalkuliere ich Ihnen die Treppenhausreinigung. **Wie viele Stockwerke** hat das Haus? (inkl. EG, z. B. 3)",
      quickReplies: ["3 Stockwerke", "4 Stockwerke", "5 Stockwerke"],
    };
  }
  if (next === "wohnungen") {
    return {
      text: `Danke — **${draft.stockwerke} Stockwerke**. Und **wie viele Wohnungen / Parteien** sind es?`,
      quickReplies: ["6 Wohnungen", "8 Wohnungen", "12 Wohnungen"],
    };
  }
  if (next === "stairTurnus") {
    return {
      text: `Alles klar, **${draft.wohnungen} Wohnungen**. In welchem **Turnus** soll das Treppenhaus gereinigt werden?`,
      quickReplies: ["Wöchentlich", "Alle 14 Tage", "Monatlich"],
    };
  }
  if (next === "dirtLevel") {
    return {
      text: "Wie schätzen Sie die **Verschmutzung** ein?",
      quickReplies: ["Normal", "Erhöht", "Stark"],
    };
  }
  if (next === "keller") {
    return {
      text: "Soll der **Kellerflur** mitgereinigt werden?",
      quickReplies: ["Ja, mit Keller", "Nein, ohne Keller"],
    };
  }
  if (next === "kellerTurnus") {
    const allowed = allowedKellerTurnus(draft.stairTurnus!);
    const labels = allowed.map((t) => TURNUS_LABEL[t]);
    return {
      text: `Keller gerne. Welcher **Keller-Turnus**? (möglich: ${labels.join(", ")})`,
      quickReplies: allowed.map((t) =>
        t === "weekly" ? "Keller wöchentlich" : t === "biweekly" ? "Keller alle 14 Tage" : "Keller monatlich"
      ),
    };
  }
  return {
    text: "Einen Moment — ich prüfe Ihre Angaben.",
    quickReplies: [],
  };
}

export function extractTreppenhausPatch(message: string): TreppenhausDraft {
  const lower = message.toLowerCase();
  const patch: TreppenhausDraft = {};

  const stock =
    lower.match(/(\d+)\s*(?:stock|etage|stockwerke?|kat)/i) ||
    (/^\s*(\d+)\s*$/.test(lower) ? lower.match(/(\d+)/) : null);
  // bare number only if short message
  if (!stock && /^\s*\d{1,2}\s*$/.test(message.trim())) {
    const n = Number(message.trim());
    if (n >= 1 && n <= 12) patch.stockwerke = n;
  } else if (stock) {
    const n = Number(stock[1]);
    if (n >= 1 && n <= 12) patch.stockwerke = n;
  }

  const whg = lower.match(/(\d+)\s*(?:wohnung|wohnungen|parteien|daire)/i);
  if (whg) {
    const n = Number(whg[1]);
    if (n >= 1 && n <= 40) patch.wohnungen = n;
  }

  if (/\b(wöchentlich|woechentlich|her\s*hafta|weekly)\b/i.test(lower) && !/keller/i.test(lower)) {
    patch.stairTurnus = "weekly";
  } else if (/\b(14\s*tage|vierzehn|alle\s*zwei|biweekly|14\s*g[uü]n)\b/i.test(lower) && !/keller/i.test(lower)) {
    patch.stairTurnus = "biweekly";
  } else if (/\b(monatlich|ayda|monthly)\b/i.test(lower) && !/keller/i.test(lower)) {
    patch.stairTurnus = "monthly";
  }

  if (/\b(normal|übliche|uebliche)\b/i.test(lower)) patch.dirtLevel = "normal";
  if (/\b(erhöht|erhoeht|orta|medium|viel\s*verkehr)\b/i.test(lower)) patch.dirtLevel = "medium";
  if (/\b(stark|ağır|agir|heavy|sehr\s*schmutzig)\b/i.test(lower)) patch.dirtLevel = "heavy";

  if (/\b(ohne\s*keller|kein\s*keller|keller\s*nein|hayır.*keller|keller\s*yok)\b/i.test(lower)) {
    patch.keller = false;
  } else if (/\b(mit\s*keller|keller\s*ja|ja.*keller|keller\s*var)\b/i.test(lower)) {
    patch.keller = true;
  } else if (/\bkeller\b/i.test(lower) && /\b(ja|evet|yes)\b/i.test(lower)) {
    patch.keller = true;
  } else if (/^(ja|evet|yes)\s*$/i.test(message.trim()) ) {
    // context-dependent — handled by caller with pending field
  } else if (/^(nein|hayır|hayir|no)\s*$/i.test(message.trim())) {
    // context-dependent
  }

  if (/keller/i.test(lower)) {
    if (/\b(wöchentlich|woechentlich)\b/i.test(lower)) patch.kellerTurnus = "weekly";
    if (/\b(14\s*tage|vierzehn|alle\s*zwei)\b/i.test(lower)) patch.kellerTurnus = "biweekly";
    if (/\b(monatlich)\b/i.test(lower)) patch.kellerTurnus = "monthly";
  }

  if (/\b(aufzug|asansör|asansor)\b/i.test(lower)) {
    patch.aufzug = !/\b(ohne|kein|yok|hayır|hayir)\b/i.test(lower);
  }
  if (/\b(glas|handlauf|korkuluk)\b/i.test(lower)) {
    patch.glasHandlauf = !/\b(ohne|kein|yok)\b/i.test(lower);
  }

  return patch;
}

function applyYesNoForPending(
  draft: TreppenhausDraft,
  message: string,
  pending: (keyof TreppenhausInput) | undefined
): TreppenhausDraft {
  const t = message.trim().toLowerCase();
  if (pending === "keller") {
    if (/^(ja|evet|yes|mit)\b/i.test(t) || /\bja\b/i.test(t)) return { ...draft, keller: true };
    if (/^(nein|hayır|hayir|no|ohne)\b/i.test(t) || /\bnein\b/i.test(t))
      return { ...draft, keller: false };
  }
  return draft;
}

function mergeDraft(base: TreppenhausDraft, patch: TreppenhausDraft): TreppenhausDraft {
  const next = { ...base, ...patch };
  if (next.stairTurnus && next.keller && next.kellerTurnus) {
    next.kellerTurnus = syncKellerTurnus(next.stairTurnus, next.kellerTurnus);
  }
  if (next.keller === false) {
    delete next.kellerTurnus;
  }
  if (next.keller === true && next.stairTurnus && !next.kellerTurnus) {
    next.kellerTurnus = syncKellerTurnus(next.stairTurnus, next.stairTurnus);
  }
  if (next.aufzug === undefined) next.aufzug = false;
  if (next.glasHandlauf === undefined) next.glasHandlauf = false;
  return next;
}

export function formatTreppenhausQuoteText(input: TreppenhausInput): string {
  const quote = calculateTreppenhausQuote(input);
  const lines = [
    `Alles klar — hier Ihre **Orientierung** für die Treppenhausreinigung:`,
    ``,
    `**${formatEuroFromCents(quote.monthlyGrossCents)} brutto / Monat**`,
    `(${formatEuroFromCents(quote.monthlyNetCents)} netto)`,
    ``,
    `**Ihre Angaben:**`,
    `• ${input.stockwerke} Stockwerke, ${input.wohnungen} Wohnungen`,
    `• Turnus: ${TURNUS_LABEL[input.stairTurnus]}`,
    `• Verschmutzung: ${DIRT_LABEL[input.dirtLevel]}`,
    `• Keller: ${input.keller ? TURNUS_LABEL[input.kellerTurnus] : "nein"}`,
    `• Aufzug: ${input.aufzug ? "ja" : "nein"}, Glas/Handlauf: ${input.glasHandlauf ? "ja" : "nein"}`,
    ``,
    ORIENTIERUNG_DISCLAIMER_DE,
  ];
  if (quote.needsInspection) {
    lines.push(``, `_Hinweis: Bei dieser Größe empfehlen wir eine kurze Objektprüfung._`);
  }
  lines.push(
    ``,
    `Möchten Sie etwas ändern (z. B. „5 Stockwerke“ oder „ohne Keller“)? Dann rechne ich sofort neu. Oder wir nehmen Ihre Daten für ein verbindliches Festpreis-Angebot auf.`
  );
  return lines.join("\n");
}

/**
 * Advance Treppenhaus chat: extract → merge → ask or quote.
 */
export function advanceTreppenhausDialog(
  session: ConciergeSession,
  message: string
): TreppenhausDialogResult {
  const pending = missingTreppenhausFields(getTreppenhausDraft(session))[0];
  let draft = getTreppenhausDraft(session);
  draft = applyYesNoForPending(draft, message, pending);
  draft = mergeDraft(draft, extractTreppenhausPatch(message));

  // If only a bare number and we're waiting for stockwerke or wohnungen
  if (/^\s*\d{1,2}\s*$/.test(message.trim())) {
    const n = Number(message.trim());
    if (pending === "stockwerke" && n >= 1 && n <= 12) draft = { ...draft, stockwerke: n };
    if (pending === "wohnungen" && n >= 1 && n <= 40) draft = { ...draft, wohnungen: n };
  }

  const nextSession = withTreppenhausDraft(
    { ...session, turns: session.turns + 1 },
    draft
  );

  if (isTreppenhausComplete(draft)) {
    const input = draft as TreppenhausInput;
    return {
      session: nextSession,
      text: formatTreppenhausQuoteText(input),
      actions: [
        link("Im Rechner öffnen", routes.treppenhausreinigungAngebot),
        phoneAction(),
      ],
      quickReplies: ["Ohne Keller", "Wöchentlich", "Festpreis anfragen", "Andere Leistung"],
      emittedEuro: true,
      complete: true,
    };
  }

  const ask = askNext(draft);
  const started = Object.keys(getTreppenhausDraft(session)).length === 0;
  const prefix = started
    ? ""
    : missingTreppenhausFields(draft).length < missingTreppenhausFields(getTreppenhausDraft(session)).length
      ? ""
      : "";

  return {
    session: nextSession,
    text: `${prefix}${ask.text}`,
    actions: [phoneAction()],
    quickReplies: ask.quickReplies,
    emittedEuro: false,
    complete: false,
  };
}

export function shouldHandleTreppenhausDialog(
  session: ConciergeSession,
  message: string
): boolean {
  if (session.assistantProduct === "treppenhaus" || session.treppenhausDraft) {
    return true;
  }
  return /treppenhaus|treppen\s*haus|kellerflur/i.test(message);
}
