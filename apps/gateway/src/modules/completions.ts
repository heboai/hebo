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
  convertToOpenAICompatibleFinishReason,
  convertToOpenAICompatibleMessage,
} from "~gateway/utils/openai-compatible-converter";
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

      const finish_reason = convertToOpenAICompatibleFinishReason(
        result.finishReason,
      );

      return {
        id: "chatcmpl-" + crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: convertToOpenAICompatibleMessage(result),
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
