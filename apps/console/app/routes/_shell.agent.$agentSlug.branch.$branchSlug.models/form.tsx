"use client";

import { useEffect, useRef, useState } from "react";

import { Form, useActionData, useNavigation } from "react-router";
import { object, nonEmpty, pipe, string, trim } from "valibot";
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
import { RadioGroup, RadioGroupItem } from "@hebo/shared-ui/components/RadioGroup";

export const ModelConfigSchema = object({
  alias: pipe(string(), trim(), nonEmpty("Alias is required")),
  type: pipe(string(), trim(), nonEmpty("Model type is required")),
});

interface ModelConfigurationFormProps {
  models: Array<{ alias: string; type: string }>;
  agentSlug: string;
  branchSlug: string;
}

export default function ModelConfigurationForm({ models: branchModels, agentSlug, branchSlug }: ModelConfigurationFormProps) {
  const actionData = useActionData<any>();
  useActionDataErrorToast();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  // Track which item is open (only one can be open at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Track local models state - sync with branch models
  const [models, setModels] = useState(branchModels);

  // Close the form immediately on save submit
  useEffect(() => {
    if (!isSubmitting) return;
    if (!currentIntent.startsWith("save:")) return;
    const saveIndex = Number(currentIntent.slice(5));
    if (!Number.isFinite(saveIndex)) return;
    setOpenIndex((prev) => (prev === saveIndex ? null : prev));
  }, [isSubmitting, currentIntent]);

  // Update local state when branch models change (after successful submission)
  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      setModels(branchModels);
      toast.success(actionData.message);
    }
  }, [actionData, navigation.state]);

  // Hidden input ref to pass full models snapshot to action
  const modelsJsonInputRef = useRef<HTMLInputElement>(null);
  const prepareModelsJson = (snapshot: Array<{ alias: string; type: string }>) => {
    if (modelsJsonInputRef.current) {
      modelsJsonInputRef.current.value = JSON.stringify(snapshot);
    }
  };

  const handleAddModel = () => {
    const newModels = [...models, { alias: "", type: "" }];
    setModels(newModels);
    const newIndex = newModels.length - 1;
    setOpenIndex(newIndex);
  };

  return (
    <div className="max-w-2xl min-w-0 w-full px-4 sm:px-6 md:px-0 py-4">
      <Form method="post">
        <input type="hidden" name="modelsJson" ref={modelsJsonInputRef} />
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
              const isRemoving = isSubmitting && currentIntent === `remove:${index}`;
              
              return (
                <div key={index}>
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
                    prepareModelsJson={prepareModelsJson}
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
  prepareModelsJson: (snapshot: Array<{ alias: string; type: string }>) => void;
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
  allModels,
  prepareModelsJson
}: ModelRowProps) {
  // Track routing selection for header badge + submit hidden input
  const [routing, setRouting] = useState<"default" | "custom">("default");
  // Hidden input to register routing selection in native form submit
  const routingInputRef = useRef<HTMLInputElement>(null);

  const handleRoutingChange = (value: string) => {
    setRouting((value as "default" | "custom") ?? "default");
    if (routingInputRef.current) routingInputRef.current.value = value;
  };
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
              {routing === "custom" ? "Custom" : "Default"}
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
                <div>
                  <input type="hidden" name={`models[${index}].routing`} defaultValue="default" ref={routingInputRef} />
                  <RadioGroup defaultValue="default" onValueChange={handleRoutingChange}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="default" id={`models-${index}-routing-default`} />
                      <Label htmlFor={`models-${index}-routing-default`}>Default</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="custom" id={`models-${index}-routing-custom`} />
                      <Label htmlFor={`models-${index}-routing-custom`}>Custom</Label>
                    </div>
                  </RadioGroup>
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
                    onClick={() => prepareModelsJson(allModels.filter((_, i) => i !== index))}
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
                    onClick={() => prepareModelsJson(allModels)}
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