import { proxy } from "valtio";

export const agentStore = proxy<{
  agents: string[];
  activeAgent: string | undefined;
}>({
  agents: [],
  activeAgent: undefined,
});
