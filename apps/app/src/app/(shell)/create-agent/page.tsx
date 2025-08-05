'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupportedModels } from '~/config/models';
import { useAgentAwareness } from '~/lib/data/agents';
import CreateAgentForm from './CreateAgentForm';

export default function CreateAgentPage() {
  const models = getSupportedModels();
  const { activeAgent } = useAgentAwareness();
  const router = useRouter();

  // If agent already exists, redirect to root
  useEffect(() => {
    if (activeAgent) {
      router.push('/');
    }
  }, [activeAgent, router]);

  // Don't render anything while redirecting
  if (activeAgent) {
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center overflow-hidden">
      <CreateAgentForm models={models} />
    </div>
  );
}
