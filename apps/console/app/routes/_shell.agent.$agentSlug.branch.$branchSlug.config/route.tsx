"use client";

import { parseWithValibot } from "@conform-to/valibot";
import { useRouteLoaderData, useParams } from "react-router";
import { api } from "~console/lib/service";
import { parseError } from "~console/lib/errors";

import type { Route } from "./+types/route";
import ModelConfigurationForm, { ModelConfigSchema } from "./form";

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  // Only proceed when a Save button is clicked
  if (!intent.startsWith("save:")) {
    return undefined;
  }

  // Parse the form data with Conform
  const submission = parseWithValibot(formData, { schema: ModelConfigSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    const { models } = submission.value;

    // Send the entire models array to the API
    const { error: putError } = await api
      .agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .put({ models });

    if (putError) {
      return submission.reply({
        formErrors: [parseError(putError).message],
      });
    }

    return { success: true, message: "Model updated successfully" };
  } catch (error) {
    return submission.reply({
      formErrors: [parseError(error).message],
    });
  }
}

export default function AgentBranchConfig() {
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Array<{ alias: string; type: string }> }> };
  }>("routes/_shell.agent.$agentSlug")!;
  
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <ModelConfigurationForm 
        agent={agent} 
        agentSlug={agentSlug!} 
        branchSlug={branchSlug!} 
      />
    </div>
  );
}