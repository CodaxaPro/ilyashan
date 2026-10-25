import type { AiCompletionRequest, AiCompletionResponse, AiProvider } from "./types";

export type MockAiScript =
  | { type: "text"; content: string }
  | { type: "tool"; name: string; arguments: Record<string, unknown> };

/**
 * Deterministic provider for corporate tests — no network.
 */
export class MockAiProvider implements AiProvider {
  readonly id = "mock";
  private step = 0;

  constructor(private readonly script: MockAiScript[]) {}

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    void req;
    const next = this.script[this.step++] ?? { type: "text" as const, content: "Wie kann ich helfen?" };
    if (next.type === "text") {
      return { content: next.content, toolCalls: [], model: "mock" };
    }
    return {
      content: null,
      toolCalls: [
        {
          id: `call_${this.step}`,
          name: next.name,
          argumentsJson: JSON.stringify(next.arguments),
        },
      ],
      model: "mock",
    };
  }
}
