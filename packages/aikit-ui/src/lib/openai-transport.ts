/* eslint-disable */

import {
  HttpChatTransport,
  type HttpChatTransportInitOptions,
  type FinishReason,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { parseJsonEventStream, type ParseResult } from "@ai-sdk/provider-utils";

type OpenAIContentPart =
  | { type: "text"; text: string }
  | {
      type: "file";
      file: { data: string; media_type: string; filename: string };
    };

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
  reasoning_content?: string;
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

type ToolCall = {
  id: string;
  type: string;
  name: string;
  arguments: string;
};

type OpenAIHttpChatTransportOptions =
  HttpChatTransportInitOptions<UIMessage> & {
    model: string;
    reasoningEffort?: "low" | "medium" | "high";
  };

export class OpenAIHttpChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends HttpChatTransport<UI_MESSAGE> {
  constructor(options: OpenAIHttpChatTransportOptions) {
    const { model, reasoningEffort, ...rest } = options;
    const fetchImpl = rest.fetch ?? globalThis.fetch;
    super({
      ...rest,
      fetch: fetchImpl,
      prepareSendMessagesRequest: async ({ messages, body }) => {
        const openaiMessages = await Promise.all(
          messages.map((m) => toOpenAIMessage(m as UIMessage, fetchImpl)),
        );

        const reasoning = reasoningEffort
          ? { effort: reasoningEffort }
          : undefined;

        return {
          body: {
            ...body,
            model,
            messages: openaiMessages,
            stream: true,
            ...(reasoning ? { reasoning } : {}),
          },
        };
      },
    });
  }

  protected processResponseStream(
    stream: ReadableStream<Uint8Array>,
  ): ReadableStream<UIMessageChunk> {
    return new ReadableStream<UIMessageChunk>({
      start: async (controller) => {
        await handleSSEStream(stream, controller);
      },
    });
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

async function handleSSEStream(
  stream: ReadableStream<Uint8Array>,
  controller: ReadableStreamDefaultController<UIMessageChunk>,
) {
  const messageId = crypto.randomUUID();
  const textId = `text-${messageId}`;
  const reasoningId = `reasoning-${messageId}`;
  let textStarted = false;
  let reasoningStarted = false;
  let finalFinish: FinishReason | undefined;

  await parseJsonEventStream<OpenAIChatDelta>({
    stream,
    schema: undefined as unknown as any,
  })
    .pipeThrough(
      new TransformStream<ParseResult<OpenAIChatDelta>, UIMessageChunk>({
        start(ctrl) {
          ctrl.enqueue({ type: "start", messageId });
        },
        transform(result, ctrl) {
          if (!result?.success) {
            ctrl.enqueue({
              type: "error",
              errorText: result?.error?.message ?? "Stream parse error",
            });
            return;
          }

          const parsed = result.value;
          const delta = parsed.choices?.[0]?.delta;
          const finishReason = parsed.choices?.[0]?.finish_reason;

          if (delta?.content) {
            if (!textStarted) {
              ctrl.enqueue({ type: "text-start", id: textId });
              textStarted = true;
            }
            ctrl.enqueue({
              type: "text-delta",
              id: textId,
              delta: delta.content,
            });
          }

          if (delta?.reasoning_content) {
            if (!reasoningStarted) {
              ctrl.enqueue({ type: "reasoning-start", id: reasoningId });
              reasoningStarted = true;
            }
            ctrl.enqueue({
              type: "reasoning-delta",
              id: reasoningId,
              delta: asText(delta.reasoning_content),
            });
          }

          if (delta?.tool_calls?.length) {
            ctrl.enqueue({
              type: "data-openai-tool-calls",
              data: normalizeToolCalls(delta.tool_calls),
            } as any);
          }

          if (finishReason) {
            finalFinish = toFinishReason(finishReason);
          }
        },
        flush(ctrl) {
          if (textStarted) ctrl.enqueue({ type: "text-end", id: textId });
          if (reasoningStarted) {
            ctrl.enqueue({ type: "reasoning-end", id: reasoningId });
          }
          ctrl.enqueue({
            type: "finish",
            finishReason: finalFinish ?? "stop",
          });
        },
      }),
    )
    .pipeTo(
      new WritableStream({
        write(chunk) {
          controller.enqueue(chunk);
        },
        close() {
          controller.close();
        },
      }),
    );
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
