import { calculateOfficeCleaningQuote, toPublicQuotePayload } from "./calculate";
import { DEFAULT_CLEANING_CONFIG, type CleaningEngineConfig } from "./seed-config";
import type { CustomerInput } from "./types";
import { hasBlockingErrors } from "./validation";

export function getActiveCleaningConfig(): CleaningEngineConfig {
  // P1: seed config. Later: load versioned config from DB/KV without mutating history.
  return DEFAULT_CLEANING_CONFIG;
}

export function serverCalculateCleaningQuote(
  input: CustomerInput,
  config: CleaningEngineConfig = getActiveCleaningConfig()
) {
  const calc = calculateOfficeCleaningQuote(input, config);
  return {
    calc,
    public: toPublicQuotePayload(calc),
    blocking: hasBlockingErrors(calc.admin.validation),
    config,
  };
}

export function logClientServerDiscrepancy(args: {
  quoteReference?: string;
  clientNetCents?: number;
  serverNetCents: number;
}): void {
  if (typeof args.clientNetCents !== "number" || !Number.isFinite(args.clientNetCents)) {
    return;
  }
  const delta = Math.round(args.serverNetCents - args.clientNetCents);
  if (delta === 0) return;
  console.warn("[cleaning] client/server price discrepancy", {
    quoteReference: args.quoteReference,
    clientNetCents: args.clientNetCents,
    serverNetCents: args.serverNetCents,
    discrepancyCents: delta,
  });
}
