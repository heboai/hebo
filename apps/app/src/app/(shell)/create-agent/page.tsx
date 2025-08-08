"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getSupportedModels } from "~/config/models";
import { useAgentAwareness } from "~/lib/data/agents";

import CreateAgentForm from "./CreateAgentForm";


export default function CreateAgentPage() {
  const queryClient = new QueryClient();
  const models = getSupportedModels();
  const { activeAgent } = useAgentAwareness();
  const router = useRouter();

  // If agent already exists, redirect to root
  useEffect(() => {
    if (activeAgent) {
      router.push("/");
    }
  }, [activeAgent, router]);

  // Don't render anything while redirecting
  if (activeAgent) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen items-center justify-center overflow-hidden">
        <CreateAgentForm models={models} />
      </div>
    </QueryClientProvider>
  );
}
