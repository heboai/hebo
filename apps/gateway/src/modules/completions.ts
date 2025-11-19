import { generateText, streamText, type ModelMessage } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { provider } from "~gateway/middlewares/provider";
import {
  toModelMessages,
  toOpenAICompatibleNonStreamResponse,
  toOpenAICompatibleStream,
  toToolChoice,
  toToolSet,
} from "~gateway/utils/converters";
import { getModelType } from "~gateway/utils/get-model-type";
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

      const toolSet = toToolSet(tools);

      const modelType = await getModelType(dbClient, model);
      const chatModel = provider.chat(modelType);

      const modelMessages = toModelMessages(messages);

      const coreToolChoice = toToolChoice(toolChoice);

      if (stream) {
        const result = streamText({
          model: chatModel,
          messages: modelMessages as ModelMessage[],
          tools: toolSet,
          toolChoice: coreToolChoice,
          temperature,
        });

        const responseStream = toOpenAICompatibleStream(result, model);

        return new Response(responseStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const result = await generateText({
        model: chatModel,
        messages: modelMessages as ModelMessage[],
        tools: toolSet,
        toolChoice: coreToolChoice,
        temperature,
      });

      return toOpenAICompatibleNonStreamResponse(result, model);
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
