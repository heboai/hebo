"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { stackApp } from "~/lib/auth";
import { getSupportedModels } from '~/services/loadModels';
import CreateAgentContent from "~/app/create-agent/CreateAgentContent";

const ClientShell = () => {
  const models = getSupportedModels();
  const user = stackApp.useUser();
  const router = useRouter();
  const [checkingAgent, setCheckingAgent] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    // For now, skip agent existence check for simplicity
    setCheckingAgent(false);
  }, [user, router]);

  if (user === undefined || checkingAgent) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div>
      <header>
        <span>Hebo</span>
      </header>
      <main>
        <CreateAgentContent models={models} />
      </main>
    </div>
  );
};

export default ClientShell; 