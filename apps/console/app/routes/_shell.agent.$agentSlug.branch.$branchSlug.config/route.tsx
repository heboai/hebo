"use client";

import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";

import type { Route } from "./+types/route";
import ModelConfigurationForm, { BranchConfigSchema } from "./form";

type Model = { alias: string; type: string };

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const action = String(formData.get("intent"));

  if (action === "remove") {
    const alias = String(formData.get("alias"));
    if (!alias.trim()) {
      return { status: "error", error: { "": ["Alias is required to remove a model"] } };
    }

    if (alias === "default") {
      return { status: "error", error: { "": ["Cannot delete default model"] } };
    }

    try {
      const currentModelsJson = String(formData.get("currentModels"));
      const currentModels: Model[] = JSON.parse(currentModelsJson);
      const updatedModels = currentModels.filter((m: Model) => m.alias !== alias);

      const { error: putError } = await api
        .agents({ agentSlug: params.agentSlug! })
        .branches({ branchSlug: params.branchSlug! })
        .put({ models: updatedModels });

      if (putError) {
        return { status: "error", error: { "": [String(putError.value)] } };
      }

      return { success: true, message: "Model configuration removed successfully" };
    } catch (error) {
      console.error("Error removing model config:", error);
      return { status: "error", error: { "": ["An unexpected error occurred while removing model"] } };
    }
  }

  // Handle create/update operations
  const submission = parseWithValibot(formData, { schema: BranchConfigSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { alias, modelType } = submission.value;

  try {
    const currentModelsJson = String(formData.get("currentModels"));
    const currentModels: Model[] = JSON.parse(currentModelsJson);
    const originalAlias = String(formData.get("originalAlias") || "");

    // Use originalAlias for lookup if it exists (edit mode), otherwise use new alias (create mode)
    const lookupAlias = originalAlias || alias;
    const modelIndex = currentModels.findIndex((m: Model) => m.alias === lookupAlias);
    const updatedModel = { alias, type: modelType };

    let updatedModels;
    if (modelIndex === -1) {
      // Model not found - adding new model
      updatedModels = [...currentModels, updatedModel];
    } else {
      // Model found - updating existing model
      updatedModels = currentModels.map((m: Model, index: number) => (index === modelIndex ? updatedModel : m));
    }

    const { error: putError } = await api
      .agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .put({ models: updatedModels });

    if (putError) {
      return submission.reply({ formErrors: [String(putError.value)] });
    }

    return { success: true, message: "Model configuration updated successfully" };
  } catch (error) {
    console.error("Error updating model config:", error);
    return submission.reply({ formErrors: ["An unexpected error occurred while updating model configuration"] });
  }
}

export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  return <ModelConfigurationForm />;
}
