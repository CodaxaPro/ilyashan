export {
  isAssistantToolsEnabled,
  isAssistantAiEnabled,
  isAssistantAiConfigured,
  canRunAssistantAi,
} from "./feature-flag";
export { resolveProduct } from "./resolve-product";
export { buildAssistantPriceReply } from "./reply";
export { processConciergeMessageAsync } from "./process";
export {
  mayEmitEuroAmount,
  priceDisclosureFor,
  calculatorHrefFor,
  ORIENTIERUNG_DISCLAIMER_DE,
  MANUAL_PRICE_DISCLAIMER_DE,
} from "./policy";
export {
  priceFenster,
  priceTreppenhaus,
  priceBuero,
  priceManualService,
} from "./tools/price";
export type {
  AssistantProductLine,
  PriceDisclosure,
  AssistantToolResult,
  OrientierungPriceData,
} from "./types";
export type { AiRunMeta } from "./ai/types";
