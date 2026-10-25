/**
 * 1-tap / tool Rückruf — structured CRM lead + admin mail, priority flagged.
 */
import type { ConciergeSession } from "@/lib/concierge/types";
import { submitSalesLead, type SubmitSalesLeadResult } from "./submit-lead";

export type RequestCallbackInput = {
  name: string;
  phone: string;
  session: ConciergeSession;
  /** Why they want a call — urgency, preferred window, etc. */
  reason?: string;
  /** When true, prefix admin-facing note as Mitarbeiter-Übergabe */
  humanHandoff?: boolean;
};

export async function requestCallback(
  input: RequestCallbackInput
): Promise<SubmitSalesLeadResult> {
  const tags: string[] = [];
  if (input.humanHandoff) {
    tags.push("MITARBEITER-ÜBERGABE — bitte persönlich übernehmen");
  } else {
    tags.push("RÜCKRUF 1-TAP — schnellstmöglich anrufen");
  }
  if (input.reason?.trim()) {
    tags.push(input.reason.trim());
  }

  const result = await submitSalesLead({
    name: input.name,
    phone: input.phone,
    session: input.session,
    customerNote: tags.join("\n"),
  });

  if (!result.ok) return result;

  const first = input.name.trim().split(/\s+/)[0] ?? input.name.trim();
  return {
    ok: true,
    messageDe: input.humanHandoff
      ? `Alles klar, ${first} — ich übergebe Sie an unser Team. Wir melden uns persönlich unter ${input.phone.trim()}. Bei Eile können Sie auch direkt anrufen.`
      : `Alles klar, ${first} — Rückruf ist notiert. Wir melden uns schnellstmöglich unter ${input.phone.trim()}.`,
  };
}
