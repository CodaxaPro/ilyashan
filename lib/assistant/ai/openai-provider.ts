import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiMessage,
  AiProvider,
  AiToolCall,
} from "./types";

/**
 * OpenAI Chat Completions + tools.
 * Requires OPENAI_API_KEY. Model: OPENAI_ASSISTANT_MODEL or gpt-4o-mini.
 */
export class OpenAiAssistantProvider implements AiProvider {
  readonly id = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini"
  ) {}

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    const body = {
      model: this.model,
      temperature: 0.2,
      messages: req.messages.map(toOpenAiMessage),
      tools: req.tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      tool_choice: "auto" as const,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`openai_http_${res.status}:${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
      model?: string;
    };

    const msg = data.choices?.[0]?.message;
    const toolCalls: AiToolCall[] = (msg?.tool_calls ?? [])
      .filter((tc) => tc.function?.name)
      .map((tc) => ({
        id: tc.id,
        name: tc.function!.name!,
        argumentsJson: tc.function?.arguments ?? "{}",
      }));

    return {
      content: msg?.content ?? null,
      toolCalls,
      model: data.model ?? this.model,
    };
  }
}

function toOpenAiMessage(m: AiMessage): Record<string, unknown> {
  if (m.role === "tool") {
    return {
      role: "tool",
      tool_call_id: m.toolCallId,
      content: m.content,
    };
  }
  if (m.role === "assistant") {
    const out: Record<string, unknown> = {
      role: "assistant",
      content: m.content,
    };
    if (m.toolCalls?.length) {
      out.tool_calls = m.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.argumentsJson },
      }));
    }
    return out;
  }
  return { role: m.role, content: m.content };
}

export function createOpenAiProviderFromEnv(): OpenAiAssistantProvider | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAiAssistantProvider(key);
}
