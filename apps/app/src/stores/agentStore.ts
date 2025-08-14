import { proxy } from "valtio";

export const agentStore = proxy<{
  activeAgent: { slug: string; name: string } | undefined;
}>({
  activeAgent: undefined,
});
