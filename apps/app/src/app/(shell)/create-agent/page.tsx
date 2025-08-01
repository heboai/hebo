'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { stackApp } from "~/lib/auth";
import { getSupportedModels } from '~/config/models';
import CreateAgentForm from "./CreateAgentForm";

export default function CreateAgentPage() {
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

  return <CreateAgentForm models={models} />;
} 