import { NextResponse } from "next/server";
import {
  isProductionReady,
  productionReadinessScore,
  runProductionChecks,
} from "@/lib/production-check";

export async function GET() {
  const checks = runProductionChecks();
  const ready = isProductionReady();
  const score = productionReadinessScore();

  return NextResponse.json({
    status: ready ? "ready" : "incomplete",
    score,
    checks,
    timestamp: new Date().toISOString(),
  });
}
