/* eslint-disable */
/* tslint:disable */

import {
  type ChatTransport,
  type ChatRequestOptions,
  type FinishReason,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | {
            type: "file";
            file: { data: string; media_type: string; filename: string };
          }
      >;
  reasoning_content?: string;
};

type OpenAIChatDelta = {
  choices?: Array<{
    delta?: {
      role?: "assistant" | "user" | "system";
      content?: string;
      reasoning_content?: string | Array<{ type?: string; text?: string }>;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: "function" | string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
};

type OpenAIChatCompletion = {
  choices?: Array<{
    message?: {
      role?: "assistant" | "user" | "system";
      content?: string;
      reasoning_content?: string | Array<{ type?: string; text?: string }>;
      tool_calls?: Array<{
        id?: string;
        type?: "function" | string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
};

type ToolCall = {
  id: string;
  type: string;
  name: string;
  arguments: string; // raw JSON string
};

type OpenAIHttpChatTransportOptions = {
  /** Like DefaultChatTransport.api – path or full URL */
  api: string;
  /** Model name your backend/OpenAI expects */
  model: string;
  /** Use streaming SSE (recommended) */
  stream?: boolean;

  /** Optional custom fetch (for logging, retries, etc.) */
  fetch?: typeof globalThis.fetch;

  /** Extra headers (e.g. Authorization when hitting a gateway) */
  headers?: HeadersInit | (() => HeadersInit);

  /** Extra static/dynamic body fields (temperature, top_p, metadata, …) */
  extraBody?: Record<string, unknown> | (() => Record<string, unknown>);
};

export class OpenAIHttpChatTransport<UI_MESSAGE extends UIMessage = UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private readonly api: string;
  private readonly model: string;
  private readonly stream: boolean;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(private readonly options: OpenAIHttpChatTransportOptions) {
    this.api = options.api;
    this.model = options.model;
    this.stream = options.stream ?? true;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  close() {
    // no persistent connection
  }

  async reconnectToStream(
    _args: { chatId: string } & ChatRequestOptions,
  ): Promise<null> {
    // Not implemented here; you could add it later if you care.
    return null;
  }

  async sendMessages({
    abortSignal,
    chatId,
    messageId,
    messages,
    trigger,
    ...requestOptions
  }: {
    abortSignal?: AbortSignal;
    chatId: string;
    messageId?: string;
    messages: UI_MESSAGE[];
    trigger: "regenerate-message" | "submit-message";
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk>> {
    const stream = new ReadableStream<UIMessageChunk>({
      start: async (controller) => {
        try {
          const openaiMessages: OpenAIMessage[] = await Promise.all(
            messages.map((m) => toOpenAIMessage(m as any, this.fetchImpl)),
          );

          const extraBody =
            typeof this.options.extraBody === "function"
              ? this.options.extraBody()
              : (this.options.extraBody ?? {});

          // You can still pass per-call body via sendMessage({ body: { … } })
          const perCallBody =
            (requestOptions.body as Record<string, unknown> | undefined) ?? {};

          const body: any = {
            model: this.model,
            messages: openaiMessages,
            stream: this.stream,
            ...extraBody,
            ...perCallBody,
          };

          const staticHeaders =
            typeof this.options.headers === "function"
              ? this.options.headers()
              : (this.options.headers ?? {});

          const perCallHeaders =
            (requestOptions.headers as HeadersInit | undefined) ?? {};

          const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...staticHeaders,
            ...perCallHeaders,
          };

          const res = await this.fetchImpl(this.api, {
            method: "POST",
            signal: abortSignal,
            headers,
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(
              `OpenAI transport failed: ${res.status} ${res.statusText} ${text}`,
            );
          }

          const id = messageId ?? crypto.randomUUID();

          const isSSE =
            this.stream &&
            res.headers.get("content-type")?.includes("text/event-stream");

          if (isSSE) {
            // ---------- STREAMING SSE ----------
            await this.handleStreamingResponse({
              res,
              id,
              controller,
              abortSignal,
            });
          } else {
            // ---------- NON-STREAMING FALLBACK ----------
            const json = (await res.json()) as OpenAIChatCompletion;
            this.handleNonStreamingResponse({
              json,
              id,
              controller,
            });
          }
        } catch (error) {
          const errorText =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue({ type: "error", errorText } as UIMessageChunk);
          controller.close();
        }
      },
    });

    return stream;
  }

  // ---------- Non-streaming JSON ----------
  private handleNonStreamingResponse({
    json,
    id,
    controller,
  }: {
    json: OpenAIChatCompletion;
    id: string;
    controller: ReadableStreamDefaultController<UIMessageChunk>;
  }) {
    const choice = json.choices?.[0];
    const msg = choice?.message ?? {};
    const content = msg.content ?? "";

    const reasoningText = normalizeReasoning((msg as any).reasoning_content);

    const toolCalls: ToolCall[] = normalizeToolCalls(msg.tool_calls ?? []);

    controller.enqueue({ type: "start", messageId: id });

    if (reasoningText) {
      const reasoningId = crypto.randomUUID();
      controller.enqueue({ type: "reasoning-start", id: reasoningId });
      controller.enqueue({
        type: "reasoning-delta",
        id: reasoningId,
        delta: reasoningText,
      });
      controller.enqueue({ type: "reasoning-end", id: reasoningId });
    }

    if (content) {
      const textId = crypto.randomUUID();
      controller.enqueue({ type: "text-start", id: textId });
      controller.enqueue({
        type: "text-delta",
        id: textId,
        delta: content,
      });
      controller.enqueue({ type: "text-end", id: textId });
    }

    if (toolCalls.length > 0) {
      controller.enqueue({
        type: "data-openai-tool-calls",
        data: toolCalls,
      } as any);
    }

    controller.enqueue({
      type: "finish",
      finishReason: toFinishReason(choice?.finish_reason),
    });

    controller.close();
  }

  // ---------- Streaming SSE ----------
  private async handleStreamingResponse({
    res,
    id,
    controller,
    abortSignal,
  }: {
    res: Response;
    id: string;
    controller: ReadableStreamDefaultController<UIMessageChunk>;
    abortSignal?: AbortSignal;
  }) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let doneSse = false;

    let fullText = "";
    let reasoningText = "";
    const toolCalls: Record<number, ToolCall> = {};

    let textStarted = false;
    let reasoningStarted = false;
    let finalFinishReason: string | null | undefined;

    controller.enqueue({ type: "start", messageId: id });

    while (!doneSse) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const lines = event
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice("data:".length).trim();
          if (data === "[DONE]") {
            doneSse = true;
            break;
          }

          let json: OpenAIChatDelta;
          try {
            json = JSON.parse(data);
          } catch {
            continue;
          }

          const choice = json.choices?.[0];
          const delta = choice?.delta ?? {};
          const finishReason = choice?.finish_reason;

          // text
          if (delta.content) {
            fullText += delta.content;
            const textId = `text-${id}`;
            if (!textStarted) {
              controller.enqueue({ type: "text-start", id: textId });
              textStarted = true;
            }
            controller.enqueue({
              type: "text-delta",
              id: textId,
              delta: delta.content,
            });
          }

          // reasoning
          if (delta.reasoning_content) {
            const r = normalizeReasoning(delta.reasoning_content);
            if (r) {
              reasoningText += r;
              const reasoningId = `reasoning-${id}`;
              if (!reasoningStarted) {
                controller.enqueue({
                  type: "reasoning-start",
                  id: reasoningId,
                });
                reasoningStarted = true;
              }
              controller.enqueue({
                type: "reasoning-delta",
                id: reasoningId,
                delta: r,
              });
            }
          }

          // tool calls
          if (delta.tool_calls?.length) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0;
              const existing = toolCalls[index];

              const idPart = tc.id ?? existing?.id ?? crypto.randomUUID();
              const namePart = tc.function?.name ?? existing?.name ?? "unknown";
              const argsDelta = tc.function?.arguments ?? "";
              const argsCombined = (existing?.arguments ?? "") + argsDelta;

              toolCalls[index] = {
                id: idPart,
                type: tc.type ?? "function",
                name: namePart,
                arguments: argsCombined,
              };

              controller.enqueue({
                type: "data-openai-tool-calls",
                data: Object.values(toolCalls),
              } as any);
            }
          }

          if (finishReason && finishReason !== "null") {
            finalFinishReason = finishReason;
          }
        }
      }
    }

    if (textStarted) {
      controller.enqueue({ type: "text-end", id: `text-${id}` });
    } else if (fullText) {
      const textId = `text-${id}`;
      controller.enqueue({ type: "text-start", id: textId });
      controller.enqueue({
        type: "text-delta",
        id: textId,
        delta: fullText,
      });
      controller.enqueue({ type: "text-end", id: textId });
    }

    if (reasoningStarted) {
      controller.enqueue({
        type: "reasoning-end",
        id: `reasoning-${id}`,
      });
    } else if (reasoningText) {
      const reasoningId = `reasoning-${id}`;
      controller.enqueue({ type: "reasoning-start", id: reasoningId });
      controller.enqueue({
        type: "reasoning-delta",
        id: reasoningId,
        delta: reasoningText,
      });
      controller.enqueue({ type: "reasoning-end", id: reasoningId });
    }

    const toolCallList = Object.values(toolCalls);
    if (toolCallList.length > 0) {
      controller.enqueue({
        type: "data-openai-tool-calls",
        data: toolCallList,
      } as any);
    }

    controller.enqueue({
      type: "finish",
      finishReason: toFinishReason(finalFinishReason),
    });

    controller.close();
  }
}

// ---------- helpers ----------

type OpenAIContentPart = Extract<
  NonNullable<OpenAIMessage["content"]>,
  Array<unknown>
>[number];

async function toOpenAIMessage(
  message: UIMessage,
  fetchImpl: typeof fetch,
): Promise<OpenAIMessage> {
  const contentParts: OpenAIContentPart[] = [];
  const textParts: string[] = [];

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      textParts.push(part.text);
      contentParts.push({ type: "text", text: part.text });
    } else if (part.type === "file") {
      const filePart = await toFileContent(part, fetchImpl);
      if (filePart) {
        contentParts.push(filePart);
      }
    }
  }

  const base = {
    role: message.role as OpenAIMessage["role"],
  };

  if (message.role === "assistant") {
    return {
      ...base,
      content: textParts.join(""),
      reasoning_content: extractReasoning(message),
    } as any;
  }

  return {
    ...base,
    content: contentParts.length ? contentParts : textParts.join(""),
  };
}

async function toFileContent(
  part: {
    mediaType?: string;
    url?: string;
    filename?: string;
  },
  fetchImpl: typeof fetch,
): Promise<
  | {
      type: "file";
      file: { data: string; media_type: string; filename: string };
    }
  | undefined
> {
  if (!part.url) return;

  if (part.url.startsWith("data:")) {
    const [meta, data] = part.url.split(",");
    const mediaType =
      part.mediaType ?? meta.slice("data:".length, meta.indexOf(";")).trim();
    const filename = part.filename || "file";

    if (!data || !mediaType) return;

    return {
      type: "file",
      file: { data, media_type: mediaType, filename },
    };
  }

  try {
    const resp = await fetchImpl(part.url);
    const blob = await resp.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mediaType = part.mediaType || blob.type || "application/octet-stream";
    const filename = part.filename || "file";

    return {
      type: "file",
      file: { data: base64, media_type: mediaType, filename },
    };
  } catch {
    // ignore fetch errors and skip the part
  }
}

function extractReasoning(message: UIMessage): string | undefined {
  const reasoning = (message.parts ?? [])
    .filter((p: any) => p.type === "reasoning")
    .map((p: any) => p.text)
    .join("");
  return reasoning || undefined;
}

function normalizeReasoning(
  raw: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.map((r) => r.text ?? "").join("");
}

function normalizeToolCalls(
  raw: Array<{
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }>,
): ToolCall[] {
  return raw.map((tc, index) => ({
    id: tc.id ?? `tool-${index}`,
    type: tc.type ?? "function",
    name: tc.function?.name ?? "unknown",
    arguments: tc.function?.arguments ?? "",
  }));
}

function toFinishReason(raw: string | null | undefined): FinishReason {
  if (!raw || raw === "null") return "stop";
  return raw.replaceAll("_", "-") as FinishReason;
}
