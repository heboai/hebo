import { generateText, streamText, type ModelMessage } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import {
  createAIModel,
  getModelConfig,
  getProviderConfig,
} from "~gateway/middlewares/providers/service";
import {
  toModelMessages,
  toOpenAICompatibleFinishReason,
  toOpenAICompatibleMessage,
  toToolSet,
  toToolChoice,
} from "~gateway/utils/converters";
import {
  OpenAICompatibleMessage,
  OpenAICompatibleTool,
  OpenAICompatibleToolChoice,
} from "~gateway/utils/openai-compatible-api-schemas";

export const completions = new Elysia({
  name: "completions",
  prefix: "/chat/completions",
})
  .use(dbClient)
  .post(
    "/",
    async ({ body, dbClient }) => {
      const {
        model: fullModelAlias,
        messages,
        tools,
        toolChoice,
        temperature = 1,
        stream = false,
      } = body;

      const modelConfig = await getModelConfig(dbClient, fullModelAlias);
      const providerConfig = await getProviderConfig(dbClient, modelConfig);
      const chatModel = await createAIModel(
        modelConfig,
        providerConfig,
        "chat",
      );

      const toolSet = toToolSet(tools);
      const modelMessages = toModelMessages(messages);
      const coreToolChoice = toToolChoice(toolChoice);

      if (stream) {
        return streamText({
          model: chatModel,
          messages: modelMessages as ModelMessage[],
          tools: toolSet,
          toolChoice: coreToolChoice,
          temperature,
        }).toTextStreamResponse();
      }

      const result = await generateText({
        model: chatModel,
        messages: modelMessages as ModelMessage[],
        tools: toolSet,
        toolChoice: coreToolChoice,
        temperature,
      });

      const finish_reason = toOpenAICompatibleFinishReason(result.finishReason);

      return {
        id: "chatcmpl-" + crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: fullModelAlias,
        choices: [
          {
            index: 0,
            message: toOpenAICompatibleMessage(result),
            finish_reason,
          },
        ],
        usage: result.usage && {
          prompt_tokens: result.usage.inputTokens ?? 0,
          completion_tokens: result.usage.outputTokens ?? 0,
          total_tokens:
            result.usage.totalTokens ??
            (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
          completion_tokens_details: {
            reasoning_tokens: result.usage.reasoningTokens ?? 0,
          },
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
