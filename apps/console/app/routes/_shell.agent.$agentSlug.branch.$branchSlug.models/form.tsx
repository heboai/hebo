"use client";

import { useEffect, useState } from "react";

import { Form, useActionData, useNavigation, useRevalidator } from "react-router";
import { object, nonEmpty, pipe, string, trim, type InferOutput } from "valibot";
import { Split } from "lucide-react";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Card, CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@hebo/shared-ui/components/Collapsible";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { Label } from "@hebo/shared-ui/components/Label";

import { useActionDataErrorToast } from "~console/lib/errors";
import { toast } from "sonner";

export const ModelConfigSchema = object({
  alias: pipe(string(), trim(), nonEmpty("Alias is required")),
  type: pipe(string(), trim(), nonEmpty("Model type is required")),
});

export type ModelConfigFormValues = InferOutput<typeof ModelConfigSchema>;


interface ModelConfigurationFormProps {
  models: Array<{ alias: string; type: string }>;
  agentSlug: string;
  branchSlug: string;
}

export default function ModelConfigurationForm({ models: branchModels, agentSlug, branchSlug }: ModelConfigurationFormProps) {
  const actionData = useActionData<any>();
  useActionDataErrorToast();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  // Track which item is open (only one can be open at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Track local models state - sync with branch models
  const [models, setModels] = useState(branchModels);

  // Track newly added items for animation
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);

  // Track items being removed for animation
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  // Update local state when branch models change (after successful submission)
  useEffect(() => {
    setModels(branchModels);
  }, [branchModels]);

  // Close the form immediately on save submit
  useEffect(() => {
    if (isSubmitting && currentIntent.startsWith("save:")) {
      const saveIndex = Number(currentIntent.split(":")[1]);
      if (openIndex === saveIndex) {
        setOpenIndex(null);
      }
    }
  }, [isSubmitting, currentIntent, openIndex]);

  // Handle remove operations with simple animation
  useEffect(() => {
    if (isSubmitting && currentIntent.startsWith("remove:")) {
      const removeIndex = Number(currentIntent.split(":")[1]);
      if (openIndex === removeIndex) setOpenIndex(null);
      setRemovingIndex(removeIndex);
      setTimeout(() => setRemovingIndex(null), 300);
    }
  }, [isSubmitting, currentIntent, openIndex]);

  // Revalidate after successful submission to sync with server
  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      toast.success(actionData.message);
      revalidator.revalidate();
    }
  }, [actionData, navigation.state, revalidator]);

  const handleAddModel = () => {
    const newModels = [...models, { alias: "", type: "" }];
    setModels(newModels);
    const newIndex = newModels.length - 1;
    setOpenIndex(newIndex);
    setNewlyAddedIndex(newIndex);
    setTimeout(() => setNewlyAddedIndex(null), 300);
  };

  return (
    <div className="max-w-2xl min-w-0 w-full px-4 sm:px-6 md:px-0 py-4">
      <Form method="post">
        <div className="flex flex-col mb-6 mt-16">
          <h2>Model Configuration</h2>
          <p className="text-muted-foreground">
            Configure access for agents to different models and their routing behaviour (incl. to your
            existing inference endpoints). Learn more about Model Configuration
          </p>
        </div>

        {models.length > 0 && (
          <div className="w-full border border-border rounded-lg overflow-hidden mb-4">
            {models.map((model, index) => {
              const isDefault = model.alias === "default";
              const isNewlyAdded = newlyAddedIndex === index;
              const isRemoving = removingIndex === index;
              
              return (
                <div 
                  key={index}
                  className={`
                    ${isNewlyAdded ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-in-out' : ''}
                    ${isRemoving ? 'animate-out fade-out-0 slide-out-to-bottom-2 duration-300 ease-in-out' : ''}
                  `}
                >
                  <ModelRow
                    index={index}
                    model={model}
                    agentSlug={agentSlug}
                    branchSlug={branchSlug}
                    isOpen={openIndex === index}
                    onOpenChange={() => setOpenIndex(openIndex === index ? null : index)}
                    isDefault={isDefault}
                    isFirst={index === 0}
                    isSubmitting={isSubmitting && currentIntent === `save:${index}`}
                    isRemoving={isSubmitting && currentIntent === `remove:${index}`}
                    allModels={models}
                  />
                </div>
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
      </Form>
    </div>
  );
}

type ModelRowProps = {
  index: number;
  model: { alias: string; type: string };
  agentSlug: string;
  branchSlug: string;
  isOpen: boolean;
  onOpenChange: () => void;
  isDefault: boolean;
  isFirst: boolean;
  isSubmitting: boolean;
  isRemoving: boolean;
  allModels: Array<{ alias: string; type: string }>;
}

function ModelRow({ 
  index, 
  model, 
  agentSlug, 
  branchSlug, 
  isOpen, 
  onOpenChange, 
  isDefault, 
  isFirst,
  isSubmitting,
  isRemoving,
  allModels
}: ModelRowProps) {
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
            <p className="text-medium">{model.type ? (supportedModels.find((m) => m.name === model.type)?.displayName || model.type) : "—"}</p>
          </div>
          <div className="flex gap-1 items-center">
            <Split/>
            <p className="text-regular">
              Default
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

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300 ease-in-out">
          <div className="mt-4">
            <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="py-1.5" htmlFor={`models-${index}-alias`}>Model Alias</Label>
                    <Input
                      id={`models-${index}-alias`}
                      name={`models[${index}].alias`}
                      defaultValue={model.alias}
                      placeholder="Enter model alias"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="py-1.5" htmlFor={`models-${index}-type`}>Model Type</Label>
                    <Select
                      key={`models-${index}-type`}
                      placeholder="Select a model type"
                      name={`models[${index}].type`}
                      defaultValue={String(model.type ?? "")}
                      items={supportedModels.map((model) => ({
                        value: model.name,
                        name: model.displayName,
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <div className="flex">
                  <Button
                    type="submit"
                    name="intent"
                    value={`remove:${index}`}
                    variant="destructive"
                    disabled={isDefault}
                    isLoading={isRemoving}
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}