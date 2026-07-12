import { NextResponse } from "next/server";
import { assertE2eAuthorized, isE2eModeEnabled } from "@/lib/e2e/guard";
import { seedTerminFixture, type TerminFixtureScenario } from "@/lib/e2e/termin-fixture";
import { isLeadsStoreConfigured } from "@/lib/leads-store";

const SCENARIOS: TerminFixtureScenario[] = ["proposed", "pick_slot", "already_booked"];

export async function POST(request: Request) {
  if (!isE2eModeEnabled()) {
    return NextResponse.json({ error: "E2E mode disabled." }, { status: 404 });
  }
  if (!assertE2eAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isLeadsStoreConfigured()) {
    return NextResponse.json({ error: "KV not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { scenario?: string };
  const scenario = SCENARIOS.includes(body.scenario as TerminFixtureScenario)
    ? (body.scenario as TerminFixtureScenario)
    : "pick_slot";

  try {
    const fixture = await seedTerminFixture(scenario);
    return NextResponse.json({
      scenario,
      leadId: fixture.lead.id,
      anfrageNr: fixture.lead.anfrageNr,
      token: fixture.token,
      terminPath: fixture.terminPath,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fixture failed." },
      { status: 500 }
    );
  }
}
