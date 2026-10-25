/**
 * Conversational Treppenhaus quote — human Q&A, engine-backed € only.
 * Asks one clear question at a time, accepts multi-field answers, recalculates on change.
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
  /** Customer left Treppenhaus dialog — caller should clear product and continue elsewhere. */
  exited?: boolean;
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

export function clearTreppenhausDialog(session: ConciergeSession): ConciergeSession {
  const next = { ...session };
  delete next.assistantProduct;
  delete next.treppenhausDraft;
  return next;
}

export function wantsExitTreppenhausDialog(message: string): boolean {
  return /\b(andere\s+leistung|abbrechen|stopp|stop|nicht\s+mehr|fensterreinigung|fenster\s*putz|b[uü]roreinigung|\bb[uü]ro\b|praxis|bauend|renovierung|entr[uü]mpelung|gutschein)\b/i.test(
    message
  );
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
      text: "Gerne — ich rechne die Treppenhausreinigung **hier im Chat** mit unserem Preismotor durch. **Wie viele Stockwerke** hat das Haus? (EG mitgezählt, z. B. 3)",
      quickReplies: ["3 Stockwerke", "4 Stockwerke", "5 Stockwerke"],
    };
  }
  if (next === "wohnungen") {
    return {
      text: `Notiert: **${draft.stockwerke} Stockwerke**. Und **wie viele Wohnungen / Parteien** sind es?`,
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
      text: `Turnus **${TURNUS_LABEL[draft.stairTurnus!]}** — verstanden. Wie schätzen Sie die **Verschmutzung** ein? (normal / erhöht / stark)`,
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
      text: `Keller gerne dabei. Welcher **Keller-Turnus** passt? (möglich: ${labels.join(", ")})`,
      quickReplies: allowed.map((t) =>
        t === "weekly"
          ? "Keller wöchentlich"
          : t === "biweekly"
            ? "Keller alle 14 Tage"
            : "Keller monatlich"
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

  const stockLabeled = lower.match(/(\d+)\s*(?:stockwerke?|stöcke|stoecke|etagen?|kat)/i);
  if (stockLabeled) {
    const n = Number(stockLabeled[1]);
    if (n >= 1 && n <= 12) patch.stockwerke = n;
  }

  const whg = lower.match(/(\d+)\s*(?:wohnungen?|parteien|daire)/i);
  if (whg) {
    const n = Number(whg[1]);
    if (n >= 1 && n <= 40) patch.wohnungen = n;
  }

  // Two bare numbers: "3 8" or "3, 8" → stockwerke + wohnungen when both missing context
  if (patch.stockwerke === undefined && patch.wohnungen === undefined) {
    const two = message.trim().match(/^(\d{1,2})\s*[,;/]?\s+(\d{1,2})\s*$/);
    if (two) {
      const a = Number(two[1]);
      const b = Number(two[2]);
      if (a >= 1 && a <= 12) patch.stockwerke = a;
      if (b >= 1 && b <= 40) patch.wohnungen = b;
    }
  }

  // Stair turnus: ignore phrases that clearly belong to Keller only
  const withoutKellerClause = lower
    .replace(/\bohne\s*keller\b/gi, " ")
    .replace(/\bkein\s*keller\b/gi, " ")
    .replace(/\bmit\s*keller\b/gi, " ")
    .replace(/\bkeller\s*(?:ja|nein|wöchentlich|woechentlich|monatlich|alle\s*14|14\s*tage)?\b/gi, " ");

  if (/\b(wöchentlich|woechentlich|her\s*hafta|weekly)\b/i.test(withoutKellerClause)) {
    patch.stairTurnus = "weekly";
  } else if (/\b(14\s*tage|vierzehn|alle\s*zwei|biweekly|14\s*g[uü]n)\b/i.test(withoutKellerClause)) {
    patch.stairTurnus = "biweekly";
  } else if (/\b(monatlich|ayda|monthly)\b/i.test(withoutKellerClause)) {
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
  }

  // Explicit Keller-Turnus only when "Keller" is next to the turnus word
  const kellerTurnus = lower.match(
    /keller[^.]{0,24}?\b(wöchentlich|woechentlich|14\s*tage|vierzehn|alle\s*zwei|monatlich)\b|\b(wöchentlich|woechentlich|14\s*tage|monatlich)\b[^.]{0,24}?keller/i
  );
  if (kellerTurnus) {
    const chunk = kellerTurnus[0];
    if (/\b(wöchentlich|woechentlich)\b/i.test(chunk)) patch.kellerTurnus = "weekly";
    else if (/\b(14\s*tage|vierzehn|alle\s*zwei)\b/i.test(chunk)) patch.kellerTurnus = "biweekly";
    else if (/\b(monatlich)\b/i.test(chunk)) patch.kellerTurnus = "monthly";
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

function applyBareNumber(
  draft: TreppenhausDraft,
  message: string,
  pending: (keyof TreppenhausInput) | undefined
): TreppenhausDraft {
  if (!/^\s*\d{1,2}\s*$/.test(message.trim())) return draft;
  const n = Number(message.trim());
  if (pending === "stockwerke" && n >= 1 && n <= 12) return { ...draft, stockwerke: n };
  if (pending === "wohnungen" && n >= 1 && n <= 40) return { ...draft, wohnungen: n };
  // First missing numeric field if pending unknown
  if (!pending) {
    if ((!draft.stockwerke || draft.stockwerke < 1) && n >= 1 && n <= 12) {
      return { ...draft, stockwerke: n };
    }
    if ((!draft.wohnungen || draft.wohnungen < 1) && n >= 1 && n <= 40) {
      return { ...draft, wohnungen: n };
    }
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
    `Möchten Sie etwas ändern? Schreiben Sie z. B. „5 Stockwerke“, „wöchentlich“ oder „ohne Keller“ — ich rechne **sofort neu**. Oder wir nehmen Ihre Daten für ein verbindliches Festpreis-Angebot auf.`
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
  if (wantsExitTreppenhausDialog(message) && !/treppenhaus/i.test(message)) {
    return {
      session: clearTreppenhausDialog({ ...session, turns: session.turns + 1 }),
      text: "Alles klar — dann lassen wir die Treppenhaus-Kalkulation beiseite. Wobei kann ich Ihnen helfen: Fenster, Büro oder etwas anderes?",
      actions: [
        link("Fenster-Preisrechner", routes.angebot),
        link("Büro kalkulieren", routes.bueroreinigungAngebot),
        phoneAction(),
      ],
      quickReplies: ["Fenster", "Büro", "Leistungen"],
      emittedEuro: false,
      complete: false,
      exited: true,
    };
  }

  const pending = missingTreppenhausFields(getTreppenhausDraft(session))[0];
  let draft = getTreppenhausDraft(session);
  draft = applyYesNoForPending(draft, message, pending);
  draft = mergeDraft(draft, extractTreppenhausPatch(message));
  draft = applyBareNumber(draft, message, pending);

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
        link("Festpreis anfragen", routes.treppenhausreinigungAngebot),
        phoneAction(),
      ],
      quickReplies: ["Ohne Keller", "Wöchentlich", "5 Stockwerke", "Andere Leistung"],
      emittedEuro: true,
      complete: true,
    };
  }

  // Nothing understood while already collecting — gentle re-ask
  const beforeKeys = Object.keys(getTreppenhausDraft(session)).length;
  const afterMissing = missingTreppenhausFields(draft).length;
  const beforeMissing = missingTreppenhausFields(getTreppenhausDraft(session)).length;
  const madeProgress = afterMissing < beforeMissing || beforeKeys === 0;

  const ask = askNext(draft);
  if (!madeProgress && beforeKeys > 0) {
    return {
      session: nextSession,
      text: `Kurz nochmal — ${ask.text}`,
      actions: [phoneAction()],
      quickReplies: ask.quickReplies,
      emittedEuro: false,
      complete: false,
    };
  }

  return {
    session: nextSession,
    text: ask.text,
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
  if (wantsExitTreppenhausDialog(message) && session.assistantProduct === "treppenhaus") {
    return true; // so advance can clear and exit
  }
  if (session.assistantProduct === "treppenhaus" || session.treppenhausDraft) {
    return true;
  }
  return /treppenhaus|treppen\s*haus|kellerflur/i.test(message);
}
