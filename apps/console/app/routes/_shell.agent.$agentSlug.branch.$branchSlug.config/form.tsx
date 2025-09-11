"use client";

import { useState } from "react";
import { Form, useActionData, useNavigation, useParams, useRouteLoaderData, useSearchParams } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { object, string, nonEmpty, pipe, trim, message, type InferOutput } from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Card } from "@hebo/shared-ui/components/Card";
import { Badge } from "@hebo/shared-ui/components/Badge";
import { CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { FormField, FormLabel, FormControl, FormMessage } from "@hebo/shared-ui/components/Form";
import { RailSymbol } from "lucide-react";

import { api } from "~console/lib/data";
import { useActionDataErrorToast } from "~console/lib/errors";

import type { Route } from "./+types/route";


type Model = { alias: string; type: string };

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
  } else {
    const submission = parseWithValibot(formData, { schema: BranchConfigSchema });

    if (submission.status !== "success") {
      return submission.reply();
    }

    const { alias, modelType } = submission.value;

    try {
      const currentModelsJson = String(formData.get("currentModels"));
      const currentModels: Model[] = JSON.parse(currentModelsJson);

      const modelIndex = currentModels.findIndex((m: Model) => m.alias === alias);
      const updatedModel = { alias, type: modelType };

      let updatedModels;
      if (modelIndex === -1) {
        updatedModels = [...currentModels, updatedModel];
      } else {
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
}

export type BranchModelFormProps = {
  onCancel: () => void;
};

export function BranchModelForm({ onCancel }: BranchModelFormProps) {
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  useActionDataErrorToast();

  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Model[] }> };
  }>("routes/_shell.agent.$agentSlug")!;
  const currentModels = agent.branches[0]?.models ?? [];

  // Determine default model internally
  const getDefaultModel = (): { alias: string; type: string } | undefined => {
    // Check URL search params for editing context
    const editAlias = searchParams.get('edit');
    if (editAlias) {
      return currentModels.find(model => model.alias === editAlias);
    }
    
    // No default model (creating new)
    return undefined;
  };

  const defaultModel = getDefaultModel();
  const isEditMode = !!defaultModel;

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
        {isEditMode && (
          <Button type="submit" name="intent" value="remove" variant="destructive" isLoading={isRemoving}>
            Remove
          </Button>
        )}
        {!isEditMode && <div />} {/* Spacer for consistent layout */}
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              // Clear the edit URL param when canceling
              const newSearchParams = new URLSearchParams(window.location.search);
              newSearchParams.delete('edit');
              const newUrl = newSearchParams.toString() 
                ? `${window.location.pathname}?${newSearchParams}` 
                : window.location.pathname;
              window.history.replaceState({}, '', newUrl);
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" name="intent" value="save" isLoading={isSaving} disabled={!fields.modelType.value}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </div>
      </CardFooter>
    </Form>
  );
}

const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") {
    return "Custom Model";
  }
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

export default function ModelConfigurationForm() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [newFormIds, setNewFormIds] = useState<string[]>([]);

  const { agent } = useRouteLoaderData<{
    agent: {
      branches: Array<{
        models: Array<{ alias: string; type: string }>;
      }>;
    };
  }>("routes/_shell.agent.$agentSlug")!;
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();
  const activeBranch = agent.branches[0];
  const models = activeBranch.models;

  return (
    <div className="absolute flex items-center w-full justify-center flex-col gap-2 max-w-lg">
      <div className="flex flex-col">
        <h2>Model Configuration</h2>
        <p className="text-muted-foreground">
          Configure access for agents to different models and their routing behaviour (incl. to your
          existing inference endpoints). Learn more about Model Configuration
        </p>
      </div>

      {models.map((m) => {
        const isOpen = !!openMap[m.alias];
        return (
          <Card key={m.alias} className="w-full border-none p-3">
            <Collapsible open={isOpen} onOpenChange={(v) => setOpenMap((prev) => ({ ...prev, [m.alias]: v }))}>
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-sm">
                  {agentSlug}/{branchSlug}/{m.alias}
                </p>
                <p className="text-sm">{getModelDisplayName(m.type)}</p>
                <Badge variant="secondary">
                  Custom <RailSymbol />
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className={isOpen ? "invisible" : ""}>
                    Edit
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                  <BranchModelForm 
                    onCancel={() => setOpenMap((prev) => ({ ...prev, [m.alias]: false }))} 
                  />
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {newFormIds.map((id) => (
        <Card key={id} className="w-full border-none p-3">
          <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
            <BranchModelForm onCancel={() => setNewFormIds((prev) => prev.filter((nid) => nid !== id))} />
          </Card>
        </Card>
      ))}

      <Button
        variant="outline"
        className="self-start"
        onClick={() => setNewFormIds((prev) => [...prev, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`])}
      >
        + Add Model
      </Button>
    </div>
  );
}