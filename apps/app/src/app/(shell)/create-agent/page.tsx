'use client';

import { getSupportedModels } from '~/config/models';
import CreateAgentForm from "./CreateAgentForm";
import { ReactQueryProvider } from '~/components/ReactQueryProvider';

export default function CreateAgentPage() {
  const models = getSupportedModels();

  return (
    <ReactQueryProvider>
      <div className="h-screen flex items-center justify-center overflow-hidden">
        <CreateAgentForm models={models} />
      </div>
    </ReactQueryProvider>
  );
} 