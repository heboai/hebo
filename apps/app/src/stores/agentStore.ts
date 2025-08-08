import { proxy } from "valtio";

export const agentStore = proxy<{
  activeAgent: string | null;
}>({
  activeAgent: null,
});
