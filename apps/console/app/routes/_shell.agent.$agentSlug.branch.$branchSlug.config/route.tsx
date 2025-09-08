"use client";

import { useState } from "react";
import { Form, useNavigation, useRouteLoaderData } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { object, string, nonEmpty, pipe, trim, message } from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/ui/components/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/ui/components/Collapsible";
import { Card, CardContent, CardFooter } from "@hebo/ui/components/Card";
import { Badge } from "@hebo/ui/components/Badge";
import { Input } from "@hebo/ui/components/Input";
import { Select } from "@hebo/ui/components/Select";
import { FormField, FormLabel, FormControl, FormMessage } from "@hebo/ui/components/Form";
import { RailSymbol } from "lucide-react";

import type { Route } from "./+types/route";

// -------------------------
// Helper Functions
// -------------------------
const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") {
    return "Custom Model";
  }
  
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

// -------------------------
// Schema
// -------------------------
const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: string(),
});

// -------------------------
// Loader & Action
// -------------------------
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return {
    agentSlug: params.agentSlug,
    branchSlug: params.branchSlug,
  };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const alias = String(formData.get("alias"));
  const modelType = String(formData.get("modelType"));
  const action = String(formData.get("_action"));

  try {
    if (action === "remove") {
      // Remove model configuration
      const response = await fetch(
        `/api/v1/agents/${params.agentSlug}/branches/${params.branchSlug}/models/${alias}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || "Failed to remove model configuration" };
      }

      return { success: true, message: "Model configuration removed successfully" };
    } else {
      // Update model configuration
      const response = await fetch(
        `/api/v1/agents/${params.agentSlug}/branches/${params.branchSlug}/models/default`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alias,
            modelType,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || "Failed to update model configuration" };
      }

      return { success: true, message: "Model configuration updated successfully" };
    }
  } catch (error) {
    console.error("Error updating model config:", error);
    return { error: "An unexpected error occurred" };
  }
}

// -------------------------
// Component
// -------------------------
export default function AgentBranchConfig({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);

  const shellData = useRouteLoaderData("routes/_shell") as {
    agents: any[];
    activeAgent: any;
    activeBranch: any;
  };

  const defaultModel = shellData?.activeBranch?.models?.find((m: any) => m.alias === "default");

  const [form, fields] = useForm({
    defaultValue: {
      alias: defaultModel?.alias || "default",
      modelType: defaultModel?.type || supportedModels[0].name,
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: BranchConfigSchema });
    },
  });

  const handleRemove = () => {
    // Create a form and submit it with remove action
    const form = document.createElement('form');
    form.method = 'post';
    form.style.display = 'none';
    
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = '_action';
    actionInput.value = 'remove';
    
    const aliasInput = document.createElement('input');
    aliasInput.type = 'hidden';
    aliasInput.name = 'alias';
    aliasInput.value = defaultModel?.alias || 'default';
    
    form.appendChild(actionInput);
    form.appendChild(aliasInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

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
                  {loaderData.agentSlug}/{loaderData.branchSlug}/{defaultModel?.alias}
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
                <Form method="post" {...getFormProps(form)} className="contents">
                  <CardContent className="space-y-6">
                    {/* Model Alias and Model Type side by side */}
                    <div className="flex gap-4">
                      {/* Alias */}
                      <FormField field={fields.alias} className="contents">
                        <div className="flex-1">
                          <FormLabel>Model Alias</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter model alias" />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormField>

                      {/* Model Type */}
                      <FormField field={fields.modelType} className="contents">
                        <div className="flex-1">
                          <FormLabel>Model Type</FormLabel>
                          <FormControl>
                            <Select
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

                    {/* Success/Error Messages */}
                    {actionData?.success && (
                      <div className="text-green-600 text-sm">
                        {actionData.message || "Model configuration updated successfully!"}
                      </div>
                    )}
                    {actionData?.error && (
                      <div className="text-destructive text-sm">{actionData.error}</div>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between">
                    <Button type="button" variant="destructive" onClick={handleRemove}>
                      Remove
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                          Cancel
                      </Button>
                      <Button type="submit" isLoading={navigation.state !== "idle"}>
                          Save
                      </Button>
                    </div>
                  </CardFooter>
                </Form>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
  );
}
