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
  
  try {
    // Use client-provided models snapshot instead of GET
    const modelsJson = String(formData.get("modelsJson") || "[]");

    let updatedModels: Array<{
      alias: string;
      type: string;
      endpoint?: { url?: string; apiKey?: string; strategy?: string } | null;
    }> = [];
    try {
      const parsed = JSON.parse(modelsJson);
      if (Array.isArray(parsed)) {
        updatedModels = parsed.map((m: any) => ({
          alias: String(m?.alias ?? ""),
          type: String(m?.type ?? ""),
          endpoint: m?.endpoint ?? null,
        }));
      }
    } catch {
      updatedModels = [];
    }

    let message = "";

    if (intent.startsWith("save:")) {
      // Overlay edited row values onto the snapshot
      const index = Number(intent.split(":")[1]);

      const alias = String(formData.get(`models[${index}].alias`) || "");
      const type = String(formData.get(`models[${index}].type`) || "");
      const routing = String(formData.get(`models[${index}].routing`) || "default");
      const endpointUrl = String(formData.get(`models[${index}].endpointUrl`) || "");
      const apiKey = String(formData.get(`models[${index}].apiKey`) || "");
      const routingStrategy = String(
        formData.get(`models[${index}].routingStrategy`) || "cheapest",
      );

      const perRowData = new FormData();
      perRowData.set("alias", alias);
      perRowData.set("type", type);

      const submission = parseWithValibot(perRowData, { schema: ModelConfigSchema });
      if (submission.status !== "success") {
        return submission.reply();
      }

      const endpoint =
        routing === "custom"
          ? {
              url: endpointUrl,
              apiKey: apiKey || undefined,
              strategy: routingStrategy || "cheapest",
            }
          : null;

      if (Number.isFinite(index) && index >= 0) {
        updatedModels[index] = { alias, type, endpoint };
      }
      message = "Model updated successfully";
    } else if (intent.startsWith("remove:")) {
      // Snapshot already reflects the removal
      message = "Model removed successfully";
    } else {
      return undefined;
    }

    // Send the complete models array via PATCH
    const res = await api
      .agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .patch({ models: updatedModels });

    if (res.error) {
      return { status: "error", error: { "": [String(res.error.value)] } };
    }

    return { success: true, message, models: updatedModels };
  } catch (error) {
    return { status: "error", error: { "": [parseError(error).message!] } };
  }
}

export default function AgentBranchConfig() {
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Array<{ alias: string; type: string; endpoint?: { url?: string; apiKey?: string; strategy?: string } | null }> }> };
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