/**
 * Chat Büro orientation — simplified inputs → same engine as Büro calculator.
 */
import { phoneAction } from "@/lib/concierge/knowledge";
import type { BueroChatDraft, ConciergeAction, ConciergeSession } from "@/lib/concierge/types";
import { redistributeFloors, redistributeSubAreas } from "@/lib/cleaning/area-sync";
import { calculateOfficeCleaningQuote } from "@/lib/cleaning/calculate";
import { createInitialCustomerInput, type CleaningFrequency } from "@/lib/cleaning/types";
import { routes } from "@/lib/routes";
import { ORIENTIERUNG_DISCLAIMER_DE } from "../policy";

export type BueroDialogResult = {
  session: ConciergeSession;
  text: string;
  actions: ConciergeAction[];
  quickReplies: string[];
  emittedEuro: boolean;
  complete: boolean;
};

function link(label: string, href: string): ConciergeAction {
  return { type: "link", label, href };
}

function formatEuro(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

/** Shared with chat→CRM materialization — same engine inputs as live orientation. */
export function buildBueroInputFromDraft(draft: BueroChatDraft) {
  const area = Math.max(20, Math.min(2000, Math.round(draft.totalAreaM2 ?? 0)));
  const frequency = (draft.frequency ?? "2_PER_WEEK") as CleaningFrequency;
  const workstations = Math.max(0, Math.min(200, Math.round(draft.workstations ?? Math.max(1, Math.round(area / 12)))));
  const toilets = Math.max(1, Math.round(workstations / 8));

  return createInitialCustomerInput({
    totalAreaM2: area,
    frequency,
    usageIntensity: "NORMAL",
    condition: "NORMAL",
    subAreas: redistributeSubAreas(area, {
      office: area * 0.55,
      meeting: area * 0.12,
      kitchen: area * 0.08,
      sanitary: area * 0.08,
      corridors: area * 0.1,
      reception: area * 0.05,
      other: area * 0.02,
    }),
    floors: redistributeFloors(area, {
      carpet: area * 0.4,
      hard: area * 0.45,
      wet: area * 0.1,
      other: area * 0.05,
    }),
    office: {
      workstations,
      officeBins: workstations,
      officeBinsAutoSuggested: true,
      meetingRooms: area >= 150 ? 1 : 0,
      meetingChairs: area >= 150 ? 6 : 0,
      cabinetExterior: false,
      shelving: false,
      windowSills: false,
      phoneMonitorExterior: false,
      whiteboards: false,
    },
    sanitary: {
      toilets,
      urinals: 0,
      washbasins: toilets,
      mirrors: toilets,
      sanitaryBins: toilets,
      showers: 0,
      cubicles: 0,
    },
    kitchen: {
      kitchens: area >= 80 ? 1 : 0,
      tables: area >= 80 ? 1 : 0,
      chairs: area >= 80 ? 4 : 0,
      sinks: area >= 80 ? 1 : 0,
      countertopUnits: 0,
      bins: area >= 80 ? 1 : 0,
      applianceExteriors: 0,
      microwaveInside: false,
      refrigeratorInside: false,
      dishwasher: false,
      cabinetFronts: false,
      dishes: false,
    },
  });
}

export function applyBueroStructuredFields(
  session: ConciergeSession,
  patch: BueroChatDraft
): BueroDialogResult {
  const draft: BueroChatDraft = { ...(session.bueroDraft ?? {}), ...patch };
  const nextSession: ConciergeSession = {
    ...session,
    assistantProduct: "buero",
    bueroDraft: draft,
    turns: session.turns + 1,
    lastIntent: "price",
  };

  if (!draft.totalAreaM2 || draft.totalAreaM2 < 20) {
    nextSession.stage = "idle";
    return {
      session: nextSession,
      text: "Für die Büro-Orientierung: Wie viele **m²** hat die Fläche ungefähr?",
      actions: [phoneAction()],
      quickReplies: ["80 m²", "120 m²", "200 m²"],
      emittedEuro: false,
      complete: false,
    };
  }

  if (!draft.frequency) {
    nextSession.stage = "idle";
    return {
      session: nextSession,
      text: `Notiert: **${draft.totalAreaM2} m²**. Wie oft soll gereinigt werden?`,
      actions: [phoneAction()],
      quickReplies: ["1× pro Woche", "2× pro Woche", "5× pro Woche", "Einmalig"],
      emittedEuro: false,
      complete: false,
    };
  }

  const input = buildBueroInputFromDraft(draft);
  const { customer } = calculateOfficeCleaningQuote(input);
  nextSession.stage = "price_ready";

  const lines = [
    `Alles klar — **Büro-Orientierung** für ca. **${draft.totalAreaM2} m²**, Turnus **${draft.frequency.replace(/_/g, " ").toLowerCase()}**:`,
    ``,
    `**${formatEuro(customer.grossCents)} brutto**`,
    `(${formatEuro(customer.netCents)} netto)`,
    ``,
    ORIENTIERUNG_DISCLAIMER_DE,
    ``,
    `**Nächster Schritt:** Name und Telefon — wir machen Festpreis und Terminvorschlag.`,
  ];

  return {
    session: nextSession,
    text: lines.join("\n"),
    actions: [
      link("Im Büro-Rechner öffnen", routes.bueroreinigungAngebot),
      phoneAction(),
    ],
    quickReplies: ["Festpreis anfragen", "Andere m²", "Andere Leistung"],
    emittedEuro: true,
    complete: true,
  };
}
