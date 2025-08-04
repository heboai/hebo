import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { queryClient } from "./queryClient";
import { agentStore } from "~/stores/agentStore";

export type Agent = {
  id: string;
  agentName: string;
  models: string[];
  branches: string[];
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
  const router = useRouter();
  
  return useMutation({
    mutationFn: createAgent,
    onSuccess: (newAgent) => {
      console.log('Created agent:', newAgent);
      agentStore.activeAgent = newAgent;
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      router.push('/');
    }
  });
};

// Hook for checking active agent and handling navigation
export const useAgentAwareness = () => {
  const router = useRouter();
  const { activeAgent } = useSnapshot(agentStore);

  useEffect(() => {
    if (!activeAgent) {
      router.push('/create-agent');
    }
  }, [activeAgent, router]);

  return { activeAgent };
}; 