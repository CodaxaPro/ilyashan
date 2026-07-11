import { listLeads } from "@/lib/leads-store";
import { getStaffConfig } from "@/lib/staff/config";
import { buildAvailabilityRange, buildOccupancyFromLeads } from "@/lib/scheduling/slot-engine";
import { getDefaultBookingRange } from "@/lib/scheduling/booking-range";

export async function loadSchedulingAvailability(options?: {
  from?: string;
  to?: string;
  excludeLeadId?: string;
}) {
  const range = options?.from && options?.to
    ? { from: options.from, to: options.to }
    : getDefaultBookingRange();

  const [staffConfig, leads] = await Promise.all([getStaffConfig(), listLeads(200)]);
  const occupancy = buildOccupancyFromLeads(leads);
  const availability = buildAvailabilityRange(
    staffConfig,
    occupancy,
    range.from,
    range.to,
    { excludeLeadId: options?.excludeLeadId }
  );

  return { staffConfig, leads, occupancy, availability };
}
