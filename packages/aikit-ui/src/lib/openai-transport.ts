/* eslint-disable */
/* Simplified OpenAI-compatible transport */
import {
  type ChatRequestOptions,
  type ChatTransport,
  type FinishReason,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

type ReasoningEffort = "low" | "medium" | "high";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
  reasoning_content?: string;
};

type OpenAIContentPart =
  | { type: "text"; text: string }
  | {
      type: "file";
      file: { data: string; media_type: string; filename: string };
    };

type OpenAIChatDelta = {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string | Array<{ text?: string }>;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
};

type OpenAIChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_content?: string | Array<{ text?: string }>;
      tool_calls?: Array<{
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
};

type ToolCall = {
  id: string;
  type: string;
  name: string;
  arguments: string;
};

type OpenAIHttpChatTransportOptions = {
  api: string;
  model: string;
  stream?: boolean;
  reasoningEffort?: ReasoningEffort;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit | (() => HeadersInit);
  extraBody?: Record<string, unknown> | (() => Record<string, unknown>);
};

export class OpenAIHttpChatTransport<UI_MESSAGE extends UIMessage = UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private readonly api: string;
  private readonly model: string;
  private readonly stream: boolean;
  private readonly reasoningEffort?: ReasoningEffort;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly headers?: HeadersInit | (() => HeadersInit);
  private readonly extraBody?:
    | Record<string, unknown>
    | (() => Record<string, unknown>);

  constructor(options: OpenAIHttpChatTransportOptions) {
    this.api = options.api;
    this.model = options.model;
    this.stream = options.stream ?? true;
    this.reasoningEffort = options.reasoningEffort;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.headers = options.headers;
    this.extraBody = options.extraBody;
  }

  close() {}
  async reconnectToStream(): Promise<null> {
    return null;
  }

  async sendMessages({
    abortSignal,
    messages,
    messageId,
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
          const openaiMessages = await Promise.all(
            messages.map((m) => toOpenAIMessage(m as any, this.fetchImpl)),
          );

          const baseHeaders =
            typeof this.headers === "function"
              ? this.headers()
              : (this.headers ?? {});
          const perCallHeaders =
            (requestOptions.headers as HeadersInit | undefined) ?? {};

          const extraBody =
            typeof this.extraBody === "function"
              ? this.extraBody()
              : (this.extraBody ?? {});
          const perCallBody =
            (requestOptions.body as Record<string, unknown> | undefined) ?? {};

          const { reasoning: perCallReasoning, ...restPerCallBody } =
            perCallBody as { reasoning?: { effort?: ReasoningEffort } };

          const reasoning =
            perCallReasoning ??
            (this.reasoningEffort
              ? { effort: this.reasoningEffort }
              : undefined);

          const res = await this.fetchImpl(this.api, {
            method: "POST",
            signal: abortSignal,
            headers: {
              "Content-Type": "application/json",
              ...baseHeaders,
              ...perCallHeaders,
            },
            body: JSON.stringify({
              model: this.model,
              messages: openaiMessages,
              stream: this.stream,
              ...(reasoning ? { reasoning } : {}),
              ...extraBody,
              ...restPerCallBody,
            }),
          });

          if (!res.ok) {
            throw new Error(
              (await res.text().catch(() => "")) || "Request failed",
            );
          }

          const id = messageId ?? crypto.randomUUID();
          const isSSE =
            this.stream &&
            res.headers.get("content-type")?.includes("text/event-stream");

          if (isSSE) {
            await handleSSE({ res, controller, id });
          } else {
            const json = (await res.json()) as OpenAIChatCompletion;
            handleJSON({ json, controller, id });
          }
        } catch (error) {
          controller.enqueue({
            type: "error",
            errorText: error instanceof Error ? error.message : "Unknown error",
          } as UIMessageChunk);
          controller.close();
        }
      },
    });

    return stream;
  }
}

// ---- helpers ----
async function toOpenAIMessage(
  message: UIMessage,
  fetchImpl: typeof fetch,
): Promise<OpenAIMessage> {
  const contentParts: OpenAIContentPart[] = [];
  const reasoningText: string[] = [];
  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      contentParts.push({ type: "text", text: part.text });
    } else if (part.type === "reasoning") {
      reasoningText.push(part.text);
    } else if (part.type === "file") {
      const filePart = await toFileContent(part, fetchImpl);
      if (filePart) contentParts.push(filePart);
    }
  }

  if (message.role === "assistant") {
    return {
      role: "assistant",
      content: contentParts.map((p) => ("text" in p ? p.text : "")).join(""),
      reasoning_content: reasoningText.join("") || undefined,
    };
  }

  return {
    role: message.role as OpenAIMessage["role"],
    content: contentParts.length ? contentParts : "",
  };
}

async function toFileContent(
  part: { mediaType?: string; url?: string; filename?: string },
  fetchImpl: typeof fetch,
): Promise<
  | {
      type: "file";
      file: { data: string; media_type: string; filename: string };
    }
  | undefined
> {
  if (!part.url) return;
  const filename = part.filename || "file";

  if (part.url.startsWith("data:")) {
    const [meta, data] = part.url.split(",");
    const mediaType =
      part.mediaType ?? meta.slice("data:".length, meta.indexOf(";")).trim();
    if (!mediaType || !data) return;
    return { type: "file", file: { data, media_type: mediaType, filename } };
  }

  try {
    const resp = await fetchImpl(part.url);
    const blob = await resp.blob();
    const mediaType = part.mediaType || blob.type || "application/octet-stream";
    const arrayBuffer = await blob.arrayBuffer();
    const data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return { type: "file", file: { data, media_type: mediaType, filename } };
  } catch {
    return;
  }
}

function handleJSON({
  json,
  controller,
  id,
}: {
  json: OpenAIChatCompletion;
  controller: ReadableStreamDefaultController<UIMessageChunk>;
  id: string;
}) {
  const choice = json.choices?.[0];
  const msg = choice?.message;
  controller.enqueue({ type: "start", messageId: id });
  if (msg?.reasoning_content) {
    const reasoningId = crypto.randomUUID();
    controller.enqueue({ type: "reasoning-start", id: reasoningId });
    controller.enqueue({
      type: "reasoning-delta",
      id: reasoningId,
      delta: asText(msg.reasoning_content),
    });
    controller.enqueue({ type: "reasoning-end", id: reasoningId });
  }
  if (msg?.content) {
    const textId = crypto.randomUUID();
    controller.enqueue({ type: "text-start", id: textId });
    controller.enqueue({
      type: "text-delta",
      id: textId,
      delta: asText(msg.content),
    });
    controller.enqueue({ type: "text-end", id: textId });
  }
  if (msg?.tool_calls?.length) {
    controller.enqueue({
      type: "data-openai-tool-calls",
      data: normalizeToolCalls(msg.tool_calls),
    } as any);
  }
  controller.enqueue({
    type: "finish",
    finishReason: toFinishReason(choice?.finish_reason),
  });
  controller.close();
}

async function handleSSE({
  res,
  controller,
  id,
}: {
  res: Response;
  controller: ReadableStreamDefaultController<UIMessageChunk>;
  id: string;
}) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  let textStarted = false;
  let reasoningStarted = false;
  controller.enqueue({ type: "start", messageId: id });

  while (!done) {
    const { value, done: doneRead } = await reader.read();
    if (doneRead) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const data = dataLine.slice(5).trim();
      if (data === "[DONE]") {
        done = true;
        break;
      }
      let json: OpenAIChatDelta;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = json.choices?.[0]?.delta;
      const finishReason = json.choices?.[0]?.finish_reason;

      if (delta?.content) {
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

      if (delta?.reasoning_content) {
        const reasoningId = `reasoning-${id}`;
        if (!reasoningStarted) {
          controller.enqueue({ type: "reasoning-start", id: reasoningId });
          reasoningStarted = true;
        }
        controller.enqueue({
          type: "reasoning-delta",
          id: reasoningId,
          delta: asText(delta.reasoning_content),
        });
      }

      if (delta?.tool_calls?.length) {
        controller.enqueue({
          type: "data-openai-tool-calls",
          data: normalizeToolCalls(delta.tool_calls),
        } as any);
      }

      if (finishReason) {
        controller.enqueue({
          type: "finish",
          finishReason: toFinishReason(finishReason),
        });
        controller.close();
        return;
      }
    }
  }

  if (textStarted) controller.enqueue({ type: "text-end", id: `text-${id}` });
  if (reasoningStarted)
    controller.enqueue({ type: "reasoning-end", id: `reasoning-${id}` });
  controller.enqueue({ type: "finish", finishReason: "stop" });
  controller.close();
}

function normalizeToolCalls(
  raw: Array<{
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }>,
): ToolCall[] {
  return raw.map((tc, i) => ({
    id: tc.id ?? `tool-${i}`,
    type: tc.type ?? "function",
    name: tc.function?.name ?? "unknown",
    arguments: tc.function?.arguments ?? "",
  }));
}

function asText(
  content: string | Array<{ text?: string }> | undefined,
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.map((p) => p.text ?? "").join("");
}

function toFinishReason(raw: string | null | undefined): FinishReason {
  if (!raw || raw === "null") return "stop";
  return raw.replaceAll("_", "-") as FinishReason;
}
