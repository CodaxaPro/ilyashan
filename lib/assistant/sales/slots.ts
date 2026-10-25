import { loadSchedulingAvailability } from "@/lib/scheduling/availability-service";
import { TIME_SLOT_LABELS_DE } from "@/lib/scheduling/slot-engine";

export type ProposedSlot = {
  date: string;
  timeSlot: string;
  labelDe: string;
};

/** Next bookable mornings/afternoons for the sales agent to offer. */
export async function listProposedSlots(limit = 8): Promise<ProposedSlot[]> {
  const { availability } = await loadSchedulingAvailability();
  const out: ProposedSlot[] = [];
  for (const day of availability.days) {
    if (!day.available) continue;
    for (const slot of day.slots) {
      if (!slot.available) continue;
      if (slot.timeSlot === "flexibel") continue;
      out.push({
        date: day.date,
        timeSlot: slot.timeSlot,
        labelDe: `${day.date} · ${TIME_SLOT_LABELS_DE[slot.timeSlot]}`,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
