import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { DEFAULT_CLEANING_CONFIG } from "@/lib/cleaning/seed-config";
import { listCleaningQuotes } from "@/lib/cleaning/quotes-store";
import { listLeads } from "@/lib/leads-store";
import {
  buildCleaningAdminOverview,
  filterBueroLeads,
} from "@/lib/cleaning/admin-overview";

export const runtime = "nodejs";

/** Admin-only: never expose this payload on public cleaning APIs. */
export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const config = DEFAULT_CLEANING_CONFIG;
  const [archiveQuotes, leads] = await Promise.all([
    listCleaningQuotes(200),
    listLeads(200),
  ]);
  const bueroLeads = filterBueroLeads(leads);
  const overview = buildCleaningAdminOverview(
    [...archiveQuotes, ...bueroLeads],
    config
  );

  return NextResponse.json({
    overview,
    config: {
      ...config,
      // Explicit admin surface — seed is CALIBRATION_REQUIRED
      calibrationPolicy: "ADMIN_ESTIMATE rates must be approved via Zeitstudien before production claims",
    },
    tasks: config.tasks,
  });
}
