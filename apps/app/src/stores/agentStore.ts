import { proxy } from "valtio";

import type { Agent } from "~/lib/data/agents";

export const agentStore = proxy<{
  activeAgent: Agent | null;
}>({
  activeAgent: null,
}); 