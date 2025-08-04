import { useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

export type Agent = {
  id: string;
  agentName: string;
  models: string[];
  // Add other agent properties as needed
};

export type CreateAgentData = {
  agentName: string;
  models: string[];
};

export type CreateAgentResponse = Agent;

// API function for creating an agent
export const createAgent = async (data: CreateAgentData): Promise<CreateAgentResponse> => {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
};

// Hook for creating an agent
export const useCreateAgent = () => {
  return useMutation({
    mutationFn: createAgent,
    onSuccess: (newAgent) => {
      console.log('Created agent:', newAgent);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}; 