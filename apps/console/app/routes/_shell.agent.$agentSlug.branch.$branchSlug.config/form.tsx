"use client";
import { Form, useActionData, useNavigation, useRouteLoaderData } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { object, string, nonEmpty, pipe, trim, message, type InferOutput } from "valibot";
import { Button } from "@hebo/shared-ui/components/Button";
import { CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { FormField, FormLabel, FormControl, FormMessage } from "@hebo/shared-ui/components/Form";
import { api } from "~console/lib/data";
import { useActionDataErrorToast } from "~console/lib/errors";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Route } from "./+types/route";

type Model = { alias: string; type: string };
type SupportedModel = { name: string; displayName?: string };

export const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
});
export type BranchConfigFormValues = InferOutput<typeof BranchConfigSchema>;

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const action = String(formData.get("intent") || formData.get("_action") || "");

  if (action === "remove") {
    const alias = String(formData.get("alias"));
    if (!alias.trim()) {
      return { status: "error", error: { "": ["Alias is required to remove a model"] } };
    }

    // Prevent deletion of default model
    if (alias === "default") {
      return { status: "error", error: { "": ["Cannot delete default model"] } };
    }

    try {
      // Get current models from hidden form field instead of using hooks
      const currentModelsJson = String(formData.get("currentModels"));
      const currentModels: Model[] = JSON.parse(currentModelsJson);
      
      // Remove the model from the models array
      const updatedModels = currentModels.filter((m: Model) => m.alias !== alias);

      // Update the entire branch with the new models JSON via Eden treaty
      const { error: putError } = await api.agents({ agentSlug: params.agentSlug! })
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
  } else {
    // Handle add/update actions with proper submissions API
    const submission = parseWithValibot(formData, { schema: BranchConfigSchema });
    
    if (submission.status !== "success") {
      return submission.reply();
    }

    const { alias, modelType } = submission.value;

    try {
      // Get current models from hidden form field instead of using hooks
      const currentModelsJson = String(formData.get("currentModels"));
      const currentModels: Model[] = JSON.parse(currentModelsJson);
      
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
  onCancel: () => void;
};

export function BranchModelForm({ defaultModel, onCancel }: BranchModelFormProps) {
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  useActionDataErrorToast();

  // Derive current models from route data
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Model[] }> };
  }>("routes/_shell.agent.$agentSlug")!;
  const currentModels = agent.branches[0]?.models ?? [];

  const currentIntent = String(navigation.formData?.get("intent") || "");
  const isSubmitting = navigation.state === "submitting";
  const isRemoving = isSubmitting && currentIntent === "remove";
  const isSaving = isSubmitting && currentIntent === "save";

  const [form, fields] = useForm<{ alias: string; modelType: string }>({
    defaultValue: {
      alias: defaultModel?.alias,
      modelType: defaultModel?.type,
    },
    onValidate({ formData }: { formData: FormData }) {
      return parseWithValibot(formData, { schema: BranchConfigSchema });
    },
    lastResult: actionData?.lastResult,
  });

  return (
    <Form method="post" {...getFormProps(form)} className="contents">
      {/* Hidden field to pass current models to the action */}
      <input type="hidden" name="currentModels" value={JSON.stringify(currentModels)} />
      
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <FormField field={fields.alias} className="contents">
            <div className="flex-1">
              <FormLabel>Model Alias</FormLabel>
              <FormControl>
                <Input placeholder="Enter model alias" />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>

          <FormField field={fields.modelType} className="contents">
            <div className="flex-1">
              <FormLabel>Model Type</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a model type"
                  items={supportedModels.map((model: { name: string; displayName?: string }) => ({
                    value: model.name,
                    name: model.displayName,
                  }))}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="submit"
          name="intent"
          value="remove"
          variant="destructive"
          isLoading={isRemoving}
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
            isLoading={isSaving}
            disabled={!fields.modelType.value}
          >
            Save
          </Button>
        </div>
      </CardFooter>
    </Form>
  );
}