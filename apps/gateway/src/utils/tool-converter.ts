import { jsonSchema, tool, type ToolChoice } from "ai";

import {
  OpenAICompatibleTool,
  OpenAICompatibleToolChoice,
} from "./openai-compatible-api-schemas";

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
): ToolChoice<any> | undefined => {
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
