"use client";

import { api } from "~console/lib/service";

import type { Route } from "./+types/route";
import ModelConfigurationForm from "./form";

type Model = { alias: string; type: string };

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  // Only proceed when a Save button is clicked
  if (!intent.startsWith("save")) {
    return null;
  }

  // Intent format: save:index
  const [, indexStr] = intent.split(":");
  const index = Number.isFinite(Number(indexStr)) ? Number(indexStr) : -1;

  try {
    const currentModelsRaw = String(formData.get("currentModels") || "[]");
    const currentModels: Model[] = JSON.parse(currentModelsRaw);

    // Read just the submitted item's fields
    const alias = String(formData.get(`models[${index}].alias`) || "").trim();
    const type = String(formData.get(`models[${index}].type`) || "").trim();

    if (!alias || !type) {
      return { status: "error", error: { "": ["Alias and type are required"] } };
    }

    const nextModels: Model[] = Array.isArray(currentModels) ? [...currentModels] : [];

    if (index >= 0 && index < nextModels.length) {
      nextModels[index] = { alias, type };
    } else if (index >= nextModels.length && index >= 0) {
      // New item appended
      nextModels.push({ alias, type });
    }

    const { error: putError } = await api
      .agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .put({ models: nextModels });

    if (putError) {
      return { status: "error", error: { "": [String(putError.value)] } };
    }

    return { success: true, message: "Model updated" };
  } catch (error) {
    console.error("Error updating model config:", error);
    return {
      status: "error",
      error: { "": ["An unexpected error occurred while updating model configuration"] },
    };
  }
}

export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <ModelConfigurationForm />
    </div>
  );
}