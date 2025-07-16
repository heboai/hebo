import { agentStore } from "@/store/agentStore";

const isOffline = !process.env.NEXT_PUBLIC_API_URL;

export type CreateAgentInput = {
  name: string;
  model: string;
};

export const createAgent = async (input: CreateAgentInput) => {
  if (isOffline) return Promise.resolve({ offline: true });
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