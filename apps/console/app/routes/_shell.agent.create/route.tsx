import { redirect } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";
import { parseError, dontRevalidateOnFormErrors } from "~console/lib/errors";

import type { Route } from "./+types/route";

import { AgentCreateForm, AgentCreateSchema } from "./form";


export async function clientAction({ request }: Route.ClientActionArgs ) {
  const formData = await request.formData();

  const submission = parseWithValibot(formData, { schema: AgentCreateSchema });
  
  if (submission.status !== 'success')
    return submission.reply();

  let result;
  try {
    result = await api.agents.post({
      name: submission.value.agentName,
      defaultModel: submission.value.defaultModel,
    });
  } catch (error) {
    return submission.reply({ formErrors: [ parseError(error).message ] });
  }
  
  if (result.error?.status === 409) 
    return submission.reply({ fieldErrors: { agentName: [String(result.error.value)] }});

  return redirect(`/agent/${result.data!.slug}/branch/main`);
}

export { dontRevalidateOnFormErrors as shouldRevalidate }

export default function AgentCreate() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AgentCreateForm />
    </div>
  );
}
