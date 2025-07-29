"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { stackApp } from "~/lib/auth";
import { getSupportedModels } from '~/services/loadModels';
import CreateAgentContent from "~/app/create-agent/CreateAgentContent";
import { SidebarFooter } from "@hebo/ui/components/Sidebar";
import Image from "next/image";
import { agentStore } from "~/stores/agentStore";
import { getAgents } from "~/services/createAgent";
import { useSnapshot } from "valtio";
import { isMockMode } from "~/lib/utils";
import { Loading } from "~/components/ui/LoadingSpinner";
import { Logo } from "~/components/ui/Logo";

const ClientShell = () => {
  // Synchronously load models
  const models = getSupportedModels();
  const user = stackApp.useUser();
  const router = useRouter();
  const [checkingAgent, setCheckingAgent] = useState(true);
  const agentSnap = useSnapshot(agentStore);

  useEffect(() => {
    // Redirect to /signin if not authenticated
    if (user === undefined) return; // still loading
    if (!user) {
      router.replace("/signin");
      return;
    }
    // Check if agent exists
    const checkAgent = async () => {
      if (isMockMode) {
        if (agentStore.agents.length > 0) {
          router.push("/");
          return;
        }
        setCheckingAgent(false);
      } else {
        try {
          const res = await getAgents();
          const agents = res.agents || [];
          if (agents.length > 0) {
            router.push("/");
            return;
          }
        } catch (err) {
          agentStore.error = err instanceof Error ? err.message : String(err);
        }
        setCheckingAgent(false);
      }
    };
    checkAgent();
  }, [user, router, agentSnap.agents.length]);

  if (user === undefined || checkingAgent) {
    // Show a full-page loading spinner while checking auth/agent
    return <Loading fullPage size="lg" />;
  }
  if (!user) {
    // Redirecting...
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2">
          <Image
            src="/hebo-icon.png"
            alt="Hebo AI Logo"
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-bold">Hebo</span>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <CreateAgentContent models={models} />
      </main>
      <footer className="w-full p-4">
        <SidebarFooter />
      </footer>
    </div>
  );
};

export default ClientShell; 