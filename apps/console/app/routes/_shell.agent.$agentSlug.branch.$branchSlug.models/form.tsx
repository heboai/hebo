"use client";

import { useActionData, useNavigation, useRevalidator } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { object, string, nonEmpty, pipe, trim, type InferOutput } from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Card, CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Split } from "lucide-react";

import { useActionDataErrorToast } from "~console/lib/errors";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";
import { Form } from "react-router";
import { useState, useEffect } from "react";

export const ModelConfigSchema = object({
  alias: pipe(string(), trim(), nonEmpty("Alias is required")),
  type: pipe(string(), trim(), nonEmpty("Model type is required")),
});

export type ModelConfigFormValues = InferOutput<typeof ModelConfigSchema>;

const getModelDisplayName = (modelName: string): string => {
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

interface ModelConfigurationFormProps {
  agent: { 
    branches: Array<{ 
      models: Array<{ alias: string; type: string }> 
    }> 
  };
  agentSlug: string;
  branchSlug: string;
}

export default function ModelConfigurationForm({ agent, agentSlug, branchSlug }: ModelConfigurationFormProps) {
  const activeBranch = agent.branches[0];

  const actionData = useActionData<any>();
  useActionDataErrorToast();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  // Track which item is open (only one can be open at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Track local models state - sync with agent data
  const [models, setModels] = useState(activeBranch.models);

  // Update local state when agent data changes (after successful submission)
  useEffect(() => {
    setModels(activeBranch.models);
  }, [activeBranch.models]);

  // Close collapsible and revalidate after successful submission
  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      setOpenIndex(null);
      revalidator.revalidate();
    }
  }, [actionData, navigation.state, revalidator]);

  const handleAddModel = () => {
    const newModels = [...models, { alias: "", type: "" }];
    setModels(newModels);
    setOpenIndex(newModels.length - 1);
  };

  const handleRemoveModel = (index: number) => {
    const newModels = models.filter((_, i) => i !== index);
    setModels(newModels);
    setOpenIndex(null);
  };

  return (
    <div className="absolute inset-0 flex justify-center">
      <div className="max-w-2xl min-w-0 w-full border-none bg-transparent shadow-none px-4 sm:px-6 md:px-0 p-4">
        <div className="flex flex-col mb-6 mt-16">
          <h2>Model Configuration</h2>
          <p className="text-muted-foreground">
            Configure access for agents to different models and their routing behaviour (incl. to your
            existing inference endpoints). Learn more about Model Configuration
          </p>
        </div>

        {/* Container card with outer border radius */}
        {models.length > 0 && (
          <div className="w-full border border-border rounded-lg overflow-hidden mb-4">
            {models.map((model, index) => {
              const isDefault = model.alias === "default";

              return (
                <ModelRow
                  key={index}
                  index={index}
                  model={model}
                  agentSlug={agentSlug}
                  branchSlug={branchSlug}
                  isOpen={openIndex === index}
                  onOpenChange={() => setOpenIndex(openIndex === index ? null : index)}
                  onRemove={() => handleRemoveModel(index)}
                  isDefault={isDefault}
                  isFirst={index === 0}
                  isSubmitting={isSubmitting && currentIntent === `save:${index}`}
                  allModels={models}
                />
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleAddModel}
            type="button"
          >
            + Add Model
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ModelRowProps {
  index: number;
  model: { alias: string; type: string };
  agentSlug: string;
  branchSlug: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onRemove: () => void;
  isDefault: boolean;
  isFirst: boolean;
  isSubmitting: boolean;
  allModels: Array<{ alias: string; type: string }>;
}

function ModelRow({ 
  index, 
  model, 
  agentSlug, 
  branchSlug, 
  isOpen, 
  onOpenChange, 
  onRemove, 
  isFirst,
  isSubmitting,
  allModels
}: ModelRowProps) {
  const actionData = useActionData<any>();

  const [form, fields] = useForm<ModelConfigFormValues>({
    defaultValue: model,
    lastResult: actionData,
  });

  return (
    <div
      className={`
        bg-card p-3
        ${!isFirst ? 'border-t border-border' : ''}
      `}
    >
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center mb-2">
          <div className="min-w-0 flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {agentSlug}/{branchSlug}/{model.alias || 'new'}
            </p>
            {model.alias && (
              <CopyToClipboardButton
                textToCopy={`${agentSlug}/${branchSlug}/${model.alias}`}
                className="shrink-0"
              />
            )}
          </div>
          <div className="text-left">
            <p className="text-medium">{model.type ? getModelDisplayName(model.type) : "—"}</p>
          </div>
          <div className="flex gap-1 items-center">
            <Split/>
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
            <Form method="post" {...getFormProps(form)}>
              <input type="hidden" name="index" value={index} />
              <input type="hidden" name="models" value={JSON.stringify(allModels)} />
              
              <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <FormField field={fields.alias} className="flex-1">
                      <FormLabel className="py-1.5">Model Alias</FormLabel>
                      <FormControl>
                        <Input
                          {...getInputProps(fields.alias, { type: "text" })}
                          placeholder="Enter model alias"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormField>

                    <FormField field={fields.type} className="flex-1">
                      <FormLabel className="py-1.5">Model Type</FormLabel>
                      <FormControl>
                        <Select
                          key={fields.type.key}
                          placeholder="Select a model type"
                          name={fields.type.name}
                          defaultValue={String((fields.type.value ?? fields.type.initialValue) ?? "")}
                          items={supportedModels.map((model) => ({
                            value: model.name,
                            name: model.displayName,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormField>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <div className="flex">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={onRemove}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onOpenChange}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      name="intent"
                      value={`save:${index}`}
                      isLoading={isSubmitting}
                    >
                      Save
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </Form>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}