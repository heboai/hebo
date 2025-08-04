'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '~/lib/queryClient';
import { getSupportedModels } from '~/config/models';
import CreateAgentForm from './CreateAgentForm';

export default function CreateAgentPage() {
  const models = getSupportedModels();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex items-center justify-center overflow-hidden">
        <CreateAgentForm models={models} />
      </div>
    </QueryClientProvider>
  );
}
