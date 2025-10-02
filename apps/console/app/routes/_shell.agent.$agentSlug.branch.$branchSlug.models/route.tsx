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

  // Handle remove action
  if (intent.startsWith("remove:")) {
    const index = Number(formData.get("index"));
    const modelsJson = String(formData.get("models") || "[]");
    
    try {
      const currentModels = JSON.parse(modelsJson);
      const updatedModels = currentModels.filter((_: any, i: number) => i !== index);

      const { error: putError } = await api
        .agents({ agentSlug: params.agentSlug! })
        .branches({ branchSlug: params.branchSlug! })
        .put({ models: updatedModels });

      if (putError) {
        return {
          formErrors: [parseError(putError).message],
        };
      }

      return { 
        success: true, 
        message: "Model removed successfully",
        models: updatedModels 
      };
    } catch (error) {
      return {
        formErrors: [parseError(error).message],
      };
    }
  }

  // Handle save action
  if (!intent.startsWith("save:")) {
    return undefined;
  }

  // Parse the form data with Conform (now expects single model, not array)
  const submission = parseWithValibot(formData, { schema: ModelConfigSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { alias, type } = submission.value;
  const index = Number(formData.get("index"));
  const modelsJson = String(formData.get("models") || "[]");
  
  try {
    // Parse the current models from the hidden field
    const currentModels = JSON.parse(modelsJson);
    
    // Update the specific model at the given index
    const updatedModels = [...currentModels];
    updatedModels[index] = { alias, type };

    // Send the entire models array to the API
    const { error: putError } = await api
      .agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .put({ models: updatedModels });

    if (putError) {
      return submission.reply({
        formErrors: [parseError(putError).message],
      });
    }

    // Return success with the updated models to trigger UI update
    return { 
      success: true, 
      message: "Model updated successfully",
      models: updatedModels 
    };
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