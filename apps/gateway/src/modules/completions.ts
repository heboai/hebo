import { generateText, streamText, type ModelMessage } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { provider } from "~gateway/middlewares/provider";
import { getModelType } from "~gateway/utils/get-model-type";
import { convertOpenAICompatibleMessagesToModelMessages } from "~gateway/utils/message-converter";
import { convertOpenAICompatibleToolsToToolSet } from "~gateway/utils/tool-converter";

export const completions = new Elysia({
  name: "completions",
  prefix: "/chat/completions",
})
  .use(dbClient)
  .use(provider)
  .post(
    "/",
    async ({ body, dbClient, provider }) => {
      const {
        model,
        messages,
        tools,
        toolChoice,
        temperature = 1,
        stream = false,
      } = body;

      const toolSet = convertOpenAICompatibleToolsToToolSet(tools);

      const modelType = await getModelType(dbClient, model);
      const chatModel = provider.chat(modelType);

      const modelMessages =
        convertOpenAICompatibleMessagesToModelMessages(messages);

      if (stream) {
        const result = streamText({
          model: chatModel,
          messages: modelMessages as ModelMessage[],
          tools: toolSet,
          toolChoice,
          temperature,
        });
        return result.toTextStreamResponse();
      }

      const result = await generateText({
        model: chatModel,
        messages: modelMessages as ModelMessage[],
        tools: toolSet,
        toolChoice,
        temperature,
      });

      const finish_reason =
        result.finishReason === "stop" || result.finishReason === "length"
          ? "stop"
          : "tool_calls";

      return {
        id: "chatcmpl-" + crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message:
              result.toolCalls && result.toolCalls.length > 0
                ? {
                    role: "assistant",
                    content: result.text,
                    tool_calls: result.toolCalls.map((toolCall) => ({
                      id: toolCall.toolCallId,
                      type: "function",
                      function: {
                        name: toolCall.toolName,
                        arguments: JSON.stringify(toolCall.input),
                      },
                    })),
                  }
                : { role: "assistant", content: result.text },
            finish_reason,
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
          t.Union([
            t.Object({
              role: t.Literal("system"),
              content: t.String(),
            }),
            t.Object({
              role: t.Literal("user"),
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
                ),
              ]),
            }),
            t.Object({
              role: t.Literal("assistant"),
              content: t.Union([t.String(), t.Null()]),
              tool_calls: t.Optional(
                t.Array(
                  t.Object({
                    id: t.String(),
                    type: t.Literal("function"),
                    function: t.Object({
                      name: t.String(),
                      arguments: t.String(),
                    }),
                  }),
                ),
              ),
            }),
            t.Object({
              role: t.Literal("tool"),
              tool_call_id: t.String(),
              content: t.String(),
            }),
          ]),
        ),
        temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        stream: t.Optional(t.Boolean()),
        tools: t.Optional(
          t.Array(
            t.Object({
              type: t.Literal("function"),
              function: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
                parameters: t.Object({}, { additionalProperties: true }),
              }),
            }),
          ),
        ),
        toolChoice: t.Optional(
          t.Union([
            t.Literal("none"),
            t.Literal("auto"),
            t.Literal("required"),
            t.Object({
              type: t.Literal("function"),
              function: t.Object({
                name: t.String(),
              }),
            }),
          ]),
        ),
      }),
    },
  );
