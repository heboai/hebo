import { generateText, streamText, type ModelMessage } from "ai";
import { Elysia, t } from "elysia";

import { provider } from "~gateway/middleware/provider";
import { convertOpenAICompatibleMessagesToModelMessages } from "~gateway/utils/message-converter";

export const completions = new Elysia({
  name: "completions",
  prefix: "/chat/completions",
})
  .use(provider)
  .post(
    "/",
    async ({ body, provider }) => {
      const { model, messages, temperature = 1, stream = false } = body;

      const chatModel = provider.chat(model);

      const modelMessages =
        convertOpenAICompatibleMessagesToModelMessages(messages);

      if (stream) {
        const result = streamText({
          model: chatModel,
          messages: modelMessages as ModelMessage[],
          temperature,
        });
        return result.toTextStreamResponse();
      }

      const result = await generateText({
        model: chatModel,
        messages: modelMessages as ModelMessage[],
        temperature,
      });

      return {
        id: "chatcmpl-" + crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: result.text },
            finish_reason: "stop",
          },
        ],
        usage: result.usage && {
          prompt_tokens: result.usage.inputTokens ?? 0,
          completion_tokens: result.usage.outputTokens ?? 0,
          total_tokens:
            result.usage.totalTokens ??
            (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
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
            content: t.Union([
              t.String(),
              t.Array(
                t.Union([
                  t.Object({
                    type: t.Literal("text"),
                    text: t.String(),
                  }),
                  t.Object({
                    type: t.Literal("image_url"),
                    image_url: t.Object({
                      url: t.String(),
                    }),
                  }),
                ]),
                { minItems: 1 },
              ),
            ]),
            name: t.Optional(t.String()),
            tool_call_id: t.Optional(t.String()),
          }),
          { minItems: 1 },
        ),
        temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        stream: t.Optional(t.Boolean()),
      }),
    },
  );
