import { jsonSchema, tool } from "ai";
import { type Static } from "elysia";

import {
  OpenAICompatibleTool as OpenAICompatibleToolSchema,
  OpenAICompatibleToolChoice as OpenAICompatibleToolChoiceSchema,
} from "./openai-compatible-api-schemas";

type OpenAICompatibleTool = Static<typeof OpenAICompatibleToolSchema>;
type OpenAICompatibleToolChoice = Static<
  typeof OpenAICompatibleToolChoiceSchema
>;

export const convertOpenAICompatibleToolsToToolSet = (
  tools: OpenAICompatibleTool[] | undefined,
) => {
  if (!tools) {
    return;
  }

  const toolSet: Record<string, any> = {};
  for (const t of tools) {
    toolSet[t.function.name] = tool({
      description: t.function.description,
      inputSchema: jsonSchema(t.function.parameters as any),
    });
  }
  return toolSet;
};

export const convertOpenAICompatibleToolChoiceToCoreToolChoice = (
  toolChoice: OpenAICompatibleToolChoice | undefined,
):
  | "none"
  | "auto"
  | "required"
  | { type: "tool"; toolName: string }
  | undefined => {
  if (!toolChoice) {
    return undefined;
  }

  if (
    toolChoice === "none" ||
    toolChoice === "auto" ||
    toolChoice === "required"
  ) {
    return toolChoice;
  }

  return {
    type: "tool",
    toolName: toolChoice.function.name,
  };
};
