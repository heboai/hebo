import { createGroq } from "@ai-sdk/groq";
import { type ModelMessage, generateText, streamText } from "ai";
import { Elysia, t } from "elysia";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

export const completions = new Elysia({
  name: "completions",
  prefix: "/chat/completions",
}).post(
  "/",
  async ({ body }) => {
    const {
      model,
      messages,
      temperature = 1,
      stream = false,
    } = body as {
      model: string;
      messages: ModelMessage[];
      temperature?: number;
      stream?: boolean;
    };

    if (stream) {
      const result = await streamText({
        model: groq(model),
        messages: messages,
        temperature,
      });
      return result.toTextStreamResponse();
    }

    const r = await generateText({
      model: groq(model),
      messages: messages,
      temperature,
    });

    return {
      id: "chatcmpl_" + crypto.randomUUID(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: r.text },
          finish_reason: "stop",
        },
      ],
      usage: r.usage && {
        prompt_tokens: r.usage.inputTokens ?? 0,
        completion_tokens: r.usage.outputTokens ?? 0,
        total_tokens:
          r.usage.totalTokens ??
          (r.usage.inputTokens ?? 0) + (r.usage.outputTokens ?? 0),
      },
    };
  },
  {
    body: t.Object({
      model: t.String(),
      messages: t.Array(
        t.Object({
          role: t.Union([
            t.Literal("system"),
            t.Literal("user"),
            t.Literal("assistant"),
            t.Literal("tool"),
          ]),
          content: t.String(),
          name: t.Optional(t.String()),
          tool_call_id: t.Optional(t.String()),
        }),
      ),
      temperature: t.Optional(t.Number()),
      stream: t.Optional(t.Boolean()),
    }),
  },
);
