import { proxy } from "valtio";

export const agentStore = proxy<{
  activeAgent: string | undefined;
}>({
  activeAgent: undefined,
});
