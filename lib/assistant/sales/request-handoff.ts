/**
 * Structured Mitarbeiter-Handoff from chat — same CRM path as Rückruf, explicit priority.
 */
import type { ConciergeSession } from "@/lib/concierge/types";
import { requestCallback } from "./request-callback";
import type { SubmitSalesLeadResult } from "./submit-lead";

export type RequestHandoffInput = {
  name: string;
  phone: string;
  session: ConciergeSession;
  /** Context for the human: elderly, stress, language, complaint, … */
  context?: string;
};

export async function requestHumanHandoff(
  input: RequestHandoffInput
): Promise<SubmitSalesLeadResult> {
  return requestCallback({
    name: input.name,
    phone: input.phone,
    session: input.session,
    humanHandoff: true,
    reason: input.context?.trim()
      ? `Kontext: ${input.context.trim()}`
      : "Kunde wünscht direkte Mitarbeiter-Betreuung",
  });
}
