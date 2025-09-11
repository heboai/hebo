"use client";

import { useFetcher } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { object, string, nonEmpty, pipe, trim, message } from "valibot";

import { Button } from "@hebo/shared-ui/components/Button";
import { CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { FormField, FormLabel, FormControl, FormMessage } from "@hebo/shared-ui/components/Form";
import { api } from "~console/lib/data";

import type { Route } from "./+types/route";
import type { Agent } from "./+types/agent";

type SupportedModel = { name: string; displayName?: string };

export const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
});

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const action = String(formData.get("intent") || formData.get("_action") || "");

  if (action === "remove") {
    const alias = String(formData.get("alias"));
    if (!alias.trim()) {
      return { error: "Alias is required to remove a model" };
    }

    // Prevent deletion of default model
    if (alias === "default") {
      return { error: "Cannot delete default model" };
    }

    try {
      // Get the current branch data from the loader
      const { agent } = (await import("react-router").then(m => m.useRouteLoaderData("routes/_shell.agent.$agentSlug"))) as { agent: Agent };
      const activeBranch = agent?.branches?.find((b: Branch) => b.slug === params.branchSlug);
      const currentModels = activeBranch?.models;

      // Remove the model from the models array
      const updatedModels = currentModels.filter((m: Model) => m.alias !== alias);

      // Update the entire branch with the new models JSON via Eden treaty
      const { error: putError } = await api.agents({ agentSlug: params.agentSlug! })
        .branches({ branchSlug: params.branchSlug! })
        .put({ models: updatedModels });

      if (putError) {
        return { error: String(putError.value) };
      }

      return { success: true, message: "Model configuration removed successfully" };
    } catch (error) {
      console.error("Error removing model config:", error);
      return { error: "An unexpected error occurred while removing model" };
    }
  } else {
    // Handle add/update actions with proper submissions API
    const submission = parseWithValibot(formData, { schema: BranchConfigSchema });
    
    if (submission.status !== "success") {
      return submission.reply();
    }

    const { alias, modelType } = submission.value;

    try {
      // Get the current branch data from the loader
      const { agent } = (await import("react-router").then(m => m.useRouteLoaderData("routes/_shell.agent.$agentSlug"))) as { agent: Agent };
      const activeBranch = agent?.branches?.find((b: Branch) => b.slug === params.branchSlug);
      const currentModels = activeBranch?.models;

      // Update or add the model in the models array
      const modelIndex = currentModels.findIndex((m: Model) => m.alias === alias);
      const updatedModel = { alias, type: modelType };
      
      let updatedModels;
      if (modelIndex === -1) {
        // Add new model
        updatedModels = [...currentModels, updatedModel];
      } else {
        // Update existing model
        updatedModels = currentModels.map((m: Model, index: number) => 
          index === modelIndex ? updatedModel : m
        );
      }

      // Update the entire branch with the new models JSON via Eden treaty
      const { error: putError } = await api.agents({ agentSlug: params.agentSlug! })
        .branches({ branchSlug: params.branchSlug! })
        .put({ models: updatedModels });

      if (putError) {
        return submission.reply({ 
          formErrors: [String(putError.value)] 
        });
      }

      return { success: true, message: "Model configuration updated successfully" };
    } catch (error) {
      console.error("Error updating model config:", error);
      return submission.reply({ 
        formErrors: ["An unexpected error occurred while updating model configuration"] 
      });
    }
  }
}

export type BranchModelFormProps = {
  defaultModel?: { alias: string; type: string } | undefined;
  supportedModels: SupportedModel[];
  onCancel: () => void;
};

export function BranchModelForm({ defaultModel, supportedModels, onCancel }: BranchModelFormProps) {
  const fetcher = useFetcher<any>();

  const [form, fields] = useForm<{ alias: string; modelType: string }>({
    defaultValue: {
      alias: defaultModel ? defaultModel.alias : "",
      modelType: defaultModel ? defaultModel.type : "",
    },
    onValidate({ formData }: { formData: FormData }) {
      return parseWithValibot(formData, { schema: BranchConfigSchema });
    },
    lastResult: fetcher.data?.lastResult,
  });

  return (
    <fetcher.Form method="post" {...getFormProps(form)} className="contents">
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <FormField field={fields.alias} className="contents">
            <div className="flex-1">
              <FormLabel>Model Alias</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter model alias"
                  name={fields.alias.name}
                  defaultValue={fields.alias.initialValue}
                  id={fields.alias.id}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>

          <FormField field={fields.modelType} className="contents">
            <div className="flex-1">
              <FormLabel>Model Type</FormLabel>
              <FormControl>
                <Select
                  name={fields.modelType.name}
                  defaultValue={fields.modelType.initialValue}
                  placeholder="Select a model type"
                  items={[
                    ...supportedModels.map((model) => ({
                      value: model.name,
                      name: (
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                        </div>
                      ),
                    })),
                  ]}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>
        </div>
        {fetcher.data?.error && (
          <div className="text-destructive text-sm">{fetcher.data?.error}</div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="submit"
          name="intent"
          value="remove"
          variant="destructive"
          isLoading={fetcher.state !== "idle"}
        >
          Remove
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            name="intent"
            value="save"
            isLoading={fetcher.state !== "idle"}
            disabled={!fields.modelType.value}
          >
            Save
          </Button>
        </div>
      </CardFooter>
    </fetcher.Form>
  );
}


