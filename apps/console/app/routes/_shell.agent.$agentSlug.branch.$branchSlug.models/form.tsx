"use client";

import { useActionData, useNavigation } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithValibot, getValibotConstraint } from "@conform-to/valibot";
import { object, array, string, nonEmpty, pipe, trim, type InferOutput } from "valibot";

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
import { useState } from "react";

export const ModelConfigSchema = object({
  models: array(
    object({
      alias: pipe(string(), trim(), nonEmpty("Alias is required")),
      type: pipe(string(), trim(), nonEmpty("Model type is required")),
    })
  ),
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
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  // Track which item is open (only one can be open at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Use Conform as the single source of truth
  const [form, fields] = useForm<ModelConfigFormValues>({
    defaultValue: { models: activeBranch.models },
    lastResult: actionData,
  });

  // Get the list of model fields from Conform
  const modelsList = fields.models.getFieldList();

  const handleAddModel = () => {
    const newIndex = modelsList.length;
    form.insert({
      name: fields.models.name,
      defaultValue: { alias: "", type: "" },
    });
    form.update();
    setOpenIndex(newIndex);
  };

  const handleRemoveModel = (index: number) => {
    form.remove({
      name: fields.models.name,
      index,
    });
    form.update();
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

        <Form
          method="post"
          {...getFormProps(form)}
          className="contents"
        >
          {/* Container card with outer border radius */}
          {modelsList.length > 0 && (
            <div className="w-full border border-border rounded-lg overflow-hidden mb-4">
              {modelsList.map((modelField, index) => {
                const aliasField = modelField.getFieldset().alias;
                const typeField = modelField.getFieldset().type;
                const isDefault = aliasField.value === "default";

                return (
                  <div
                    key={modelField.key}
                    className={`
                      bg-card p-3
                      ${index !== 0 ? 'border-t border-border' : ''}
                    `}
                  >
                    <Collapsible 
                      open={openIndex === index} 
                      onOpenChange={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center mb-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {agentSlug}/{branchSlug}/{aliasField.value || 'new'}
                          </p>
                          {aliasField.value && (
                            <CopyToClipboardButton
                              textToCopy={`${agentSlug}/${branchSlug}/${aliasField.value}`}
                              className="shrink-0"
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-medium">{typeField.value ? getModelDisplayName(typeField.value) : "—"}</p>
                        </div>
                        <div className="flex gap-1 items-center">
                          <Split/>
                          <p className="text-regular">
                            Custom
                          </p>
                        </div>
                        <div>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className={openIndex === index ? "invisible" : ""}>
                              Edit
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <CollapsibleContent className="overflow-hidden">
                        <div className="mt-4">
                          <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                            <CardContent className="space-y-6">
                              <div className="flex gap-4">
                                <FormField field={modelField.getFieldset().alias} className="flex-1">
                                  <FormLabel className="py-1.5">Model Alias</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...getInputProps(modelField.getFieldset().alias, { type: "text" })}
                                      placeholder="Enter model alias"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormField>

                                <FormField field={modelField.getFieldset().type} className="flex-1">
                                  <FormLabel className="py-1.5">Model Type</FormLabel>
                                  <FormControl>
                                    <Select
                                      key={modelField.getFieldset().type.key}
                                      placeholder="Select a model type"
                                      name={modelField.getFieldset().type.name}
                                      defaultValue={String((modelField.getFieldset().type.value ?? modelField.getFieldset().type.initialValue) ?? "")}
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
                                  onClick={() => handleRemoveModel(index)}
                                  disabled={isDefault}
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setOpenIndex(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  name="intent"
                                  value={`save:${index}`}
                                  isLoading={isSubmitting && currentIntent === `save:${index}`}
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
    </div>
  );
}