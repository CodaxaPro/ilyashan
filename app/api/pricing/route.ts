import { NextResponse } from "next/server";
import { getFensterPricingConfig } from "@/lib/pricing-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getFensterPricingConfig();
  return NextResponse.json({ config });
}
