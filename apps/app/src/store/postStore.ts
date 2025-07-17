import { proxy } from "valtio";

export type AgentCreationRequest = {
  name: string;
  model: string;
  // Optionally add more fields (e.g., timestamp, id)
};

export const postStore = proxy({
  data: [] as AgentCreationRequest[],
  processing: false,
  enqueueAgentCreation(agent: AgentCreationRequest) {
    postStore.data.push(agent);
    // Optionally, trigger async processing here or in a background effect
  },
});

// Simple async processor for the queue
export async function processAgentCreations() {
  if (postStore.processing) return;
  postStore.processing = true;
  try {
    while (postStore.data.length > 0) {
      const agent = postStore.data.shift();
      if (!agent) break;
      // Simulate API call (replace with real API call as needed)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // You can handle success/failure here (e.g., notifications)
      console.log("Processed agent creation:", agent);
    }
  } finally {
    postStore.processing = false;
  }
} 