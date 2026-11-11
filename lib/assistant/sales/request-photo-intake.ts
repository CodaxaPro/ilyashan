/**
 * P2 — assistant tool: ask customer for mandatory photos (UI lead form).
 */
import type { ConciergeSession } from "@/lib/concierge/types";
import { buildPhotoIntakePrompt, resolvePhotoIntakeRequirement } from "@/lib/photo-intake";

export function requestPhotoIntake(session: ConciergeSession): {
  ok: true;
  required: boolean;
  messageDe: string;
  openLeadForm: boolean;
} {
  const policy = resolvePhotoIntakeRequirement({ session, quote: session.quote });
  return {
    ok: true,
    required: policy.required,
    messageDe: policy.required
      ? buildPhotoIntakePrompt(session.assistantProduct)
      : `${policy.messageDe} Nutzen Sie das Formular unten, um Fotos anzuhängen.`,
    openLeadForm: true,
  };
}
