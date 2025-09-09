"use client";

import { useState } from "react";
import { useRouteLoaderData, useParams } from "react-router";
import { object, string, nonEmpty, pipe, trim, message } from "valibot";
import { parseWithValibot } from "@conform-to/valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Card, CardContent } from "@hebo/shared-ui/components/Card";
import { Badge } from "@hebo/shared-ui/components/Badge";
import { BranchModelForm } from "./form";
import { api } from "~console/lib/data";
import { RailSymbol } from "lucide-react";

import type { Route } from "./+types/route";

const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") {
    return "Custom Model";
  }
  
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
});

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const action = String(formData.get("_action"));

  let alias = "";
  let modelType = "";

  if (action === "remove") {
    alias = String(formData.get("alias") ?? "");
    if (!alias.trim()) {
      return { error: "Alias is required to remove a model" };
    }
  } else {
    const submission = parseWithValibot(formData, { schema: BranchConfigSchema });
    if (submission.status !== "success") {
      return { lastResult: submission.reply() };
    }
    alias = String(submission.payload.alias ?? "");
    modelType = String(submission.payload.modelType ?? "");

    if (!supportedModels.some((m) => m.name === modelType)) {
      return { error: "Selected model type is not supported in this deployment" };
    }
  }

  try {
    // First, fetch the current branch data using Eden treaty client
    const { data: currentBranch, error: getError } = await api.agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .get();
    
    if (getError) {
      return { error: getError.value?.toString() || "Failed to fetch branch data" };
    }
    const currentModels = currentBranch.models || [];

    let updatedModels;

    if (action === "remove") {
      // Remove the model from the models array
      updatedModels = currentModels.filter((m: any) => m.alias !== alias);
      
      // Prevent deletion of default model
      if (alias === "default") {
        return { error: "Cannot delete default model" };
      }
    } else {
      // Update or add the model in the models array
      const modelIndex = currentModels.findIndex((m: any) => m.alias === alias);
      const updatedModel = { alias, type: modelType };
      
      if (modelIndex === -1) {
        // Add new model
        updatedModels = [...currentModels, updatedModel];
      } else {
        // Update existing model
        updatedModels = currentModels.map((m: any, index: number) => 
          index === modelIndex ? updatedModel : m
        );
      }
    }

    // Update the entire branch with the new models JSON via Eden treaty
    const { error: putError } = await api.agents({ agentSlug: params.agentSlug! })
      .branches({ branchSlug: params.branchSlug! })
      .put({ models: updatedModels });

    if (putError) {
      return { error: putError.value?.toString() || "Failed to update model configuration" };
    }

    const successMessage = action === "remove" 
      ? "Model configuration removed successfully" 
      : "Model configuration updated successfully";

    return { success: true, message: successMessage };
  } catch (error) {
    console.error("Error updating model config:", error);
    return { error: "An unexpected error occurred" };
  }
}

export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shellData = useRouteLoaderData("routes/_shell") as {
    agents: any[];
    activeAgent: any;
    activeBranch: any;
  };

  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();

  const defaultModel = shellData?.activeBranch?.models?.find((m: any) => m.alias === "default");

  if (supportedModels.length === 0) {
    return (
      <div className="absolute flex items-center justify-center flex-col gap-2 max-w-[675px]">
        <Card className="sm:max-w-lg min-w-0 w-full border-destructive p-3">
          <CardContent>
            <div className="text-destructive text-sm">
              No supported models are configured. This is a deployment error; please configure
              `packages/shared-data/json/supported-models.json`.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="absolute flex items-center justify-center flex-col gap-2 max-w-[675px]">
      <div className="flex flex-col w-full">
        <h2>Model Configuration</h2>
        <p className="text-muted-foreground">
          Configure access for agents to different models and their routing behaviour (incl. to your
          existing inference endpoints). Learn more about Model Configuration
        </p>
      </div>

        <Card className="sm:max-w-lg min-w-0 w-full border-none p-3">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {agentSlug}/{branchSlug}/{defaultModel?.alias}
                </p>
                {defaultModel && (
                  <p className="text-sm">{getModelDisplayName(defaultModel.type)}</p>
                )}
                <Badge variant="secondary">Custom <RailSymbol /> </Badge>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="outline">{isOpen ? "Cancel" : "Edit"}</Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <Card className="sm:max-w-lg min-w-0 w-full border-none  bg-transparent shadow-none">
                <BranchModelForm
                  defaultModel={defaultModel}
                  supportedModels={supportedModels as { name: string; displayName?: string }[]}
                  onCancel={() => setIsOpen(false)}
                />
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
  );
}
