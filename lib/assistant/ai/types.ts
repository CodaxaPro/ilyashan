/**
 * AI layer types — NLU / tool orchestration only.
 * Prices, leads, calendar: never invented by the model; only via allowlisted tools.
 */

export type AiToolCall = {
  id: string;
  name: string;
  argumentsJson: string;
};

export type AiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: AiToolCall[] }
  | { role: "tool"; toolCallId: string; name: string; content: string };

export type AiToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AiCompletionRequest = {
  messages: AiMessage[];
  tools: AiToolDefinition[];
};

export type AiCompletionResponse = {
  content: string | null;
  toolCalls: AiToolCall[];
  model: string;
};

export interface AiProvider {
  readonly id: string;
  complete(req: AiCompletionRequest): Promise<AiCompletionResponse>;
}

export type AiRunMeta = {
  usedAi: boolean;
  providerId: string | null;
  toolNames: string[];
  fallbackReason: string | null;
};
