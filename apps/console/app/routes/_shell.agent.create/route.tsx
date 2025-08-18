
import { redirect } from "react-router";

import { api } from "~/lib/data";

import type { Route } from "./+types/route";

import { AgentForm } from "./form";


export async function clientAction({ request }: Route.ClientActionArgs ) {
    const formData = await request.formData();
  
    const result = await api.agents.post({
        name: String(formData.get("agentName")),
        defaultModel: String(formData.get("defaultModel")),
    });

    return result.error
      ? { error: result.error.value }
      : redirect(`/agent/${result.data.slug}`);
}

export default function Create({ actionData }: Route.ComponentProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AgentForm error={actionData?.error}/>
    </div>
  );
}
