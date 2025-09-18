"use client";

import { useState } from "react";
import { Form, useActionData, useNavigation, useParams, useRouteLoaderData, useSearchParams } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
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

import { useActionDataErrorToast } from "~console/lib/errors";


type Model = { alias: string; type: string };

export const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
});
export type BranchConfigFormValues = InferOutput<typeof BranchConfigSchema>;


export type BranchModelFormProps = {
  onCancel: () => void;
  editModel?: { alias: string; type: string };
};

export type RemoveModelFormProps = {
  model: { alias: string; type: string };
  onCancel?: () => void;
};

export function RemoveModelForm({ model, onCancel }: RemoveModelFormProps) {
  const navigation = useNavigation();
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Model[] }> };
  }>("routes/_shell.agent.$agentSlug")!;
  const currentModels = agent.branches[0]?.models ?? [];

  const currentIntent = String(navigation.formData?.get("intent") || "");
  const isRemoving = navigation.state === "submitting" && currentIntent === "remove";

  return (
    <Form method="post" className="contents">
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="alias" value={model.alias} />
      <input type="hidden" name="currentModels" value={JSON.stringify(currentModels)} />
      
      <div className="flex gap-2">
        <Button 
          type="submit" 
          variant="destructive" 
          isLoading={isRemoving}
          disabled={model.alias === "default"}
        >
          Remove
        </Button>
      </div>
    </Form>
  );
}

export function BranchModelForm({ onCancel, editModel }: BranchModelFormProps) {
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
    // First check if editModel is passed as prop (preferred method)
    if (editModel) {
      return editModel;
    }
    
    // Check URL search params for editing context (fallback)
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
  const isSaving = isSubmitting && currentIntent === "save";

  const [form, fields] = useForm<{ alias: string; modelType: string }>({
    defaultValue: {
      alias: defaultModel?.alias,
      modelType: defaultModel?.type,
    },
    constraint: getValibotConstraint(BranchConfigSchema),
    lastResult: actionData,
  });

  return (
    <Form method="post" {...getFormProps(form)} className="contents">
      <input type="hidden" name="currentModels" value={JSON.stringify(currentModels)} />
      {isEditMode && <input type="hidden" name="originalAlias" value={defaultModel?.alias} />}

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

      <CardFooter className="flex justify-between gap-2">
        <div className="flex">
          {/* Only show Remove button when editing an existing model */}
          {isEditMode && defaultModel && (
            <RemoveModelForm 
              model={defaultModel}
              onCancel={() => onCancel()}
            />
          )}
        </div>
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

  const allItems = [
    ...models.map((m) => ({ type: 'model' as const, data: m })),
    ...newFormIds.map((id) => ({ type: 'new' as const, data: id }))
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="max-w-2xl min-w-0 w-full border-none bg-transparent shadow-none">
        <div className="flex flex-col mb-6">
          <h2>Model Configuration</h2>
          <p className="text-muted-foreground">
            Configure access for agents to different models and their routing behaviour (incl. to your
            existing inference endpoints). Learn more about Model Configuration
          </p>
        </div>

      {/* Container card with outer border radius */}
      {allItems.length > 0 && (
        <div className="w-full border border-border rounded-lg overflow-hidden">
          {allItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === allItems.length - 1;
            
            if (item.type === 'model') {
              const m = item.data;
              const isOpen = !!openMap[m.alias];
              
              return (
                <div 
                  key={m.alias} 
                  className={`
                    bg-card p-3
                    ${!isFirst ? 'border-t border-border' : ''}
                  `}
                >
                  <Collapsible open={isOpen} onOpenChange={(v) => setOpenMap((prev) => ({ ...prev, [m.alias]: v }))}>
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {agentSlug}/{branchSlug}/{m.alias}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-medium">{getModelDisplayName(m.type)}</p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <RailSymbol className="size-6"/>
                        <p className="text-regular">
                          Custom
                        </p>
                      </div>
                      <div>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className={isOpen ? "invisible" : ""}>
                            Edit
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <CollapsibleContent className="overflow-hidden">
                      <div className="mt-4">
                        <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                          <BranchModelForm 
                            editModel={m}
                            onCancel={() => {
                              // Clear the edit URL parameter when canceling
                              const newSearchParams = new URLSearchParams(window.location.search);
                              newSearchParams.delete('edit');
                              const newUrl = newSearchParams.toString() 
                                ? `${window.location.pathname}?${newSearchParams}` 
                                : window.location.pathname;
                              window.history.replaceState({}, '', newUrl);
                              setOpenMap((prev) => ({ ...prev, [m.alias]: false }));
                            }} 
                          />
                        </Card>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            } else {
              const id = item.data;
              return (
                <div 
                  key={id} 
                  className={`
                    bg-card p-3
                    ${!isFirst ? 'border-t border-border' : ''}
                  `}
                >
                  <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                    <BranchModelForm onCancel={() => setNewFormIds((prev) => prev.filter((nid) => nid !== id))} />
                  </Card>
                </div>
              );
            }
          })}
        </div>
      )}

        <Button
          variant="outline"
          className="self-start mt-2"
          onClick={() => setNewFormIds((prev) => [...prev, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`])}
        >
          + Add Model
        </Button>
      </div>
    </div>
  );
}