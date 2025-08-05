'use client';

import { getSupportedModels } from '~/config/models';
import CreateAgentForm from './CreateAgentForm';

export default function CreateAgentPage() {
  const models = getSupportedModels();

  return (
    <div className="h-screen flex items-center justify-center overflow-hidden">
      <CreateAgentForm models={models} />
    </div>
  );
}
