"use client";

import { parseWithValibot } from "@conform-to/valibot";

import { api } from "~console/lib/data";

import type { Route } from "./+types/route";
import ModelConfigurationForm, { BranchModelsSchema } from "./form";

type Model = { alias: string; type: string };

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  // Only proceed when the Save button is explicitly clicked
  if (!intent.startsWith("save")) {
    return null;
  }

  // Row-level save: intent like "save:3"
  if (intent.startsWith("save:")) {
    try {
      const idxStr = intent.split(":")[1] ?? "";
      const idx = Number(idxStr);
      if (!Number.isFinite(idx)) return null;

      const alias = String(formData.get(`models[${idx}].alias`) || "").trim();
      const type = String(
        formData.get(`models[${idx}].type`) ||
        formData.get(`modelsUI[${idx}].type`) ||
        ""
      ).trim();
      const originalAlias = String(formData.get(`models[${idx}]._originalAlias`) || "").trim();
      const currentModelsJson = String(formData.get("currentModels") || "[]");
      const currentModels: Model[] = JSON.parse(currentModelsJson);

      if (!alias || !type) {
        return { status: "error", error: { "": ["Alias and type are required"] } };
      }

      const lookupAlias = originalAlias || alias;
      const modelIndex = currentModels.findIndex((m) => m.alias === lookupAlias);
      const updatedModel: Model = { alias, type };

      const updatedModels = modelIndex === -1
        ? [...currentModels, updatedModel]
        : currentModels.map((m, i) => (i === modelIndex ? updatedModel : m));

      const { error: putError } = await api
        .agents({ agentSlug: params.agentSlug! })
        .branches({ branchSlug: params.branchSlug! })
        .put({ models: updatedModels });

      if (putError) {
        return { status: "error", error: { "": [String(putError.value)] } };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating model config (row):", error);
      return { status: "error", error: { "": ["An unexpected error occurred while updating model configuration"] } };
    }
  }

  // Full save: intent === "save"
  const submission = parseWithValibot(formData, { schema: BranchModelsSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    const updatedModels: Model[] = submission.value.models;
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
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <ModelConfigurationForm />
    </div>
  );
}
