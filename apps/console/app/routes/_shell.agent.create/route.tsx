import { redirect } from "react-router";
import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";
import type { Route } from "./+types/route";
import { AgentCreateForm, AgentCreateSchema } from "./form";

export async function clientAction({ request }: Route.ClientActionArgs ) {
    const formData = await request.formData();

    const submission = parseWithValibot(formData, { schema: AgentCreateSchema });
    
    if (submission.status !== 'success')
      return submission.reply();

    // FUTURE simplify error handling
    try {
      const result = await api.agents.post({
        name: submission.value.agentName,
        defaultModel: submission.value.defaultModel,
      });
      
      if (result.error) 
        // FUTURE: helper for error parsing
        return submission.reply({ formErrors: [ String(result.error.value)] });

      return redirect(`/agent/${result.data.slug}/branches/main`);

    } catch (e: unknown) {
      // FUTURE: helper for error parsing
      return submission.reply({ formErrors: [ (e as Error).message] });
    }
}

export default function AgentCreate() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AgentCreateForm />
    </div>
  );
}
