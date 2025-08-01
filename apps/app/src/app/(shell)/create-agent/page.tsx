'use client';

import { getSupportedModels } from '~/config/models';
import CreateAgentForm from "./CreateAgentForm";

export default function CreateAgentPage() {
  const models = getSupportedModels();

  return <CreateAgentForm models={models} />;
} 