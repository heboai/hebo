import { agentStore } from "@/store/agentStore";

const isMockMode = !process.env.NEXT_PUBLIC_API_URL;

export type CreateAgentInput = {
  name: string;
  model: string;
};

export const createAgent = async (input: CreateAgentInput) => {
  if (isMockMode) {
    agentStore.agents.push({ name: input.name, model: input.model });
    return Promise.resolve({ mockMode: true, agent: { name: input.name, model: input.model } });
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    return await res.json();
  } catch (err) {
    agentStore.error = (err as Error).message;
    throw err;
  }
};

export const getAgents = async () => {
  if (isMockMode) {
    return Promise.resolve({ mockMode: true, agents: agentStore.agents });
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`);
    if (!res.ok) throw new Error("Failed to fetch agents");
    return await res.json();
  } catch (err) {
    agentStore.error = (err as Error).message;
    throw err;
  }
}; 