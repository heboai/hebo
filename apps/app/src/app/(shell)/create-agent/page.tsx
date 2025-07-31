import { getSupportedModels } from '~/services/loadModels';
import CreateAgentContent from './CreateAgentContent';

export default function CreateAgentPage() {
  const models = getSupportedModels();
  
  return <CreateAgentContent models={models} />;
} 