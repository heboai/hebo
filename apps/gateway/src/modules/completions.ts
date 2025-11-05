import { generateText, streamText, type ModelMessage } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { provider } from "~gateway/middlewares/provider";
import { getModelType } from "~gateway/utils/get-model-type";
import { convertOpenAICompatibleMessagesToModelMessages } from "~gateway/utils/message-converter";
import {
  OpenAICompatibleMessage,
  OpenAICompatibleTool,
  OpenAICompatibleToolChoice,
} from "~gateway/utils/openai-compatible-api-schemas";
import {
  convertOpenAICompatibleToolsToToolSet,
  convertOpenAICompatibleToolChoiceToCoreToolChoice,
} from "~gateway/utils/tool-converter";

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

      const coreToolChoice =
        convertOpenAICompatibleToolChoiceToCoreToolChoice(toolChoice);

      if (stream) {
        const result = streamText({
          model: chatModel,
          messages: modelMessages as ModelMessage[],
          tools: toolSet,
          toolChoice: coreToolChoice,
          temperature,
        });
        return result.toTextStreamResponse();
      }

      const result = await generateText({
        model: chatModel,
        messages: modelMessages as ModelMessage[],
        tools: toolSet,
        toolChoice: coreToolChoice,
        temperature,
      });

      const finish_reason = (() => {
        switch (result.finishReason) {
          case "stop":
            return "stop";
          case "length":
            return "length";
          case "content-filter":
            return "content_filter";
          case "tool-calls":
            return "tool_calls";
          default:
            return "stop";
        }
      })();

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
        messages: t.Array(OpenAICompatibleMessage),
        temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        stream: t.Optional(t.Boolean()),
        tools: t.Optional(t.Array(OpenAICompatibleTool)),
        toolChoice: t.Optional(OpenAICompatibleToolChoice),
      }),
    },
  );
