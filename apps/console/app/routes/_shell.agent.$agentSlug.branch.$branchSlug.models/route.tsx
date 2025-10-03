"use client";

import { parseWithValibot } from "@conform-to/valibot";
import { useRouteLoaderData, useParams } from "react-router";
import { kyFetch } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import type { Route } from "./+types/route";
import ModelConfigurationForm, { ModelConfigSchema } from "./form";

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  
  try {
    // GET current models before computing update
    const getRes = await kyFetch.get(`v1/agents/${params.agentSlug!}/branches`);
    if (!getRes.ok) throw new Error(await getRes.text());
    const branches = (await getRes.json()) as Array<{ models: Array<{ alias: string; type: string }> }>;

    const currentModels = branches?.[0]?.models ?? [];
    let updatedModels = [...currentModels];
    let message = "";

    if (intent.startsWith("remove:")) {
      // Handle remove action using index from intent
      const index = Number(intent.split(":")[1]);
      updatedModels = currentModels.filter((_: any, i: number) => i !== index);
      message = "Model removed successfully";
    } else if (intent.startsWith("save:")) {
      // Handle save action
      const submission = parseWithValibot(formData, { schema: ModelConfigSchema });
      
      if (submission.status !== "success") {
        return submission.reply();
      }

      const { alias, type } = submission.value;
      const index = Number(intent.split(":")[1]);
      
      updatedModels[index] = { alias, type };
      message = "Model updated successfully";
    } else {
      return undefined;
    }

    // Send the complete models array via PATCH
    const res = await kyFetch.patch(
      `v1/agents/${params.agentSlug!}/branches/${params.branchSlug!}`,
      { json: { models: updatedModels } },
    );

    if (!res.ok) {
      const text = await res.text();
      return { formErrors: [text] };
    }

    return { success: true, message, models: updatedModels };
  } catch (error) {
    return {
      formErrors: [parseError(error).message],
    };
  }
}

export default function AgentBranchConfig() {
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Array<{ alias: string; type: string }> }> };
  }>("routes/_shell.agent.$agentSlug")!;
  
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();

  return (
    <div className="absolute inset-0 flex justify-center">
      <ModelConfigurationForm 
        models={agent.branches[0]?.models} 
        agentSlug={agentSlug!} 
        branchSlug={branchSlug!} 
      />
    </div>
  );
}