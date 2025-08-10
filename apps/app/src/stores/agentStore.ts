import { proxy } from "valtio";

export const agentStore = proxy<{
  activeAgent: { id: string; name: string } | undefined;
}>({
  activeAgent: undefined,
});
