import { redirect } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";
import type { Route } from "./+types/route";
import { AgentCreateForm, AgentCreateSchema } from "./form";
import { useErrorToast } from "~console/lib/errors";

export async function clientAction({ request }: Route.ClientActionArgs ) {
  const formData = await request.formData();

  const submission = parseWithValibot(formData, { schema: AgentCreateSchema });
  
  if (submission.status !== 'success')
    return submission.reply();

  const result = await api.agents.post({
    name: submission.value.agentName,
    defaultModel: submission.value.defaultModel,
  });
  
  if (result.error) 
    return submission.reply({ formErrors: [ String(result.error.value)] });

  return redirect(`/agent/${result.data.slug}`);
}

function AgentCreate() {
  useErrorToast();

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AgentCreateForm />
    </div>
  );
}
export default AgentCreate;

export const ErrorBoundary = AgentCreate;
