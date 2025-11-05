import { t } from "elysia";

export const OpenAICompatibleContentPartImage = t.Object({
  type: t.Literal("image_url"),
  image_url: t.Object({
    url: t.String(),
  }),
});

export const OpenAICompatibleContentPartText = t.Object({
  type: t.Literal("text"),
  text: t.String(),
});

export const OpenAICompatibleMessageToolCall = t.Object({
  type: t.Literal("function"),
  id: t.String(),
  function: t.Object({
    arguments: t.String(),
    name: t.String(),
  }),
});

export const OpenAICompatibleSystemMessage = t.Object({
  role: t.Literal("system"),
  content: t.String(),
});

export const OpenAICompatibleUserMessage = t.Object({
  role: t.Literal("user"),
  content: t.Union([
    t.String(),
    t.Array(
      t.Union([
        OpenAICompatibleContentPartText,
        OpenAICompatibleContentPartImage,
      ]),
    ),
  ]),
});

export const OpenAICompatibleAssistantMessage = t.Object({
  role: t.Literal("assistant"),
  content: t.Union([t.String(), t.Null()]),
  tool_calls: t.Optional(t.Array(OpenAICompatibleMessageToolCall)),
});

export const OpenAICompatibleToolMessage = t.Object({
  role: t.Literal("tool"),
  content: t.String(),
  tool_call_id: t.String(),
});

export const OpenAICompatibleMessage = t.Union([
  OpenAICompatibleSystemMessage,
  OpenAICompatibleUserMessage,
  OpenAICompatibleAssistantMessage,
  OpenAICompatibleToolMessage,
]);

export const OpenAICompatibleTool = t.Object({
  type: t.Literal("function"),
  function: t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    parameters: t.Object({}, { additionalProperties: true }),
  }),
});

export const OpenAICompatibleToolChoice = t.Union([
  t.Literal("none"),
  t.Literal("auto"),
  t.Literal("required"),
  t.Object({
    type: t.Literal("function"),
    function: t.Object({
      name: t.String(),
    }),
  }),
]);
