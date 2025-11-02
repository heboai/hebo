import { jsonSchema, tool } from "ai";

type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string | undefined;
    parameters: Record<string, unknown>;
  };
};

export const convertOpenAICompatibleToolsToToolSet = (
  tools: Tool[] | undefined,
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
