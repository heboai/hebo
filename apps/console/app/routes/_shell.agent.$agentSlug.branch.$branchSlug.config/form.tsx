"use client";

import { useRef, useState } from "react";
import { Form, useActionData, useNavigation, useParams, useRouteLoaderData } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { object, array, string, nonEmpty, pipe, trim, type InferOutput } from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Card, CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { Label } from "@hebo/shared-ui/components/Label";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Split } from "lucide-react";

import { useActionDataErrorToast } from "~console/lib/errors";
import { FormControl, FormField, FormLabel, FormMessage } from "@hebo/shared-ui/components/Form";

export const ModelConfigSchema = object({
  models: array(
    object({
      alias: pipe(string(), trim(), nonEmpty()),
      type: string(),
    })
  ),
});

export type ModelConfigFormValues = InferOutput<typeof ModelConfigSchema>;

const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") return "Custom Model";
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

export default function ModelConfigurationForm() {
  const { agent } = useRouteLoaderData<{
    agent: { branches: Array<{ models: Array<{ alias: string; type: string }> }> };
  }>("routes/_shell.agent.$agentSlug")!;
  
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();
  const activeBranch = agent.branches[0];

  const actionData = useActionData<any>();
  useActionDataErrorToast();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  // Local editable items and open state
  type Item = { key: string; alias: string; type: string; originalAlias?: string };
  const [items, setItems] = useState<Item[]>(() =>
    activeBranch.models.map((m) => ({
      key: `${m.alias}-${Math.random().toString(36).slice(2, 8)}`,
      alias: m.alias,
      type: m.type,
      originalAlias: m.alias,
    })),
  );
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // Stable snapshot of initial models for server-side merge
  const initialModelsRef = useRef(activeBranch.models);

  // Conform wrapper only for submission plumbing
  const [form, fields] = useForm<ModelConfigFormValues>({
    defaultValue: { models: activeBranch.models },
    constraint: getValibotConstraint(ModelConfigSchema),
    lastResult: actionData,
    shouldValidate: "onBlur",
  });

  const modelFields = (fields as any)?.models?.getFieldList?.() ?? [];

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
          <input
            type="hidden"
            name="currentModels"
            value={JSON.stringify(items.map(({ alias, type }) => ({ alias, type })))}
          />
          {/* Container card with outer border radius */}
          {items.length > 0 && (
            <div className="w-full border border-border rounded-lg overflow-hidden">
              {items.map((item, index) => {
                const isFirst = index === 0;
                const isOpen = !!openMap[item.key];
                return (
                  <div
                    key={item.key}
                    className={`
                      bg-card p-3
                      ${!isFirst ? 'border-t border-border' : ''}
                    `}
                  >
                    <Collapsible open={isOpen} onOpenChange={(v) => setOpenMap((prev) => ({ ...prev, [item.key]: v }))}>
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center mb-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {agentSlug}/{branchSlug}/{item.alias || 'new'}
                          </p>
                          <CopyToClipboardButton
                            textToCopy={`${agentSlug}/${branchSlug}/${item.alias || 'new'}`}
                            className="shrink-0"
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-medium">{getModelDisplayName(item.type)}</p>
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
                          <Card className="min-w-0 w-full border-none bg-transparent shadow-none">
                            <CardContent className="space-y-6">
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <Label className="py-1.5">Model Alias</Label>
                                  <Input
                                    name={`models[${index}].alias`}
                                    placeholder="Enter model alias"
                                    value={item.alias}
                                    onChange={(e) =>
                                      setItems((prev) => prev.map((it, idx) => idx === index ? { ...it, alias: e.target.value } : it))
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  {modelFields[index]?.type ? (
                                    <FormField field={modelFields[index]!.type} className="flex-1">
                                      <FormLabel className="py-1.5">Model Type</FormLabel>
                                      <FormControl>
                                        <Select
                                          placeholder="Select a model type"
                                          name={modelFields[index]!.type.name}
                                          defaultValue={String(modelFields[index]!.type.initialValue ?? "")}
                                          items={supportedModels.map((model) => ({
                                            value: model.name,
                                            name: model.displayName,
                                          }))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormField>
                                  ) : (
                                    <div className="flex-1">
                                      <Label className="py-1.5">Model Type</Label>
                                      <Select
                                        placeholder="Select a model type"
                                        name={`models[${index}].type`}
                                        items={supportedModels.map((model) => ({
                                          value: model.name,
                                          name: model.displayName,
                                        }))}
                                        defaultValue={item.type}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-2">
                              <div className="flex">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                                  disabled={item.alias === "default"}
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setOpenMap((prev) => ({ ...prev, [item.key]: false }))}
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

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              className="self-start"
              onClick={() => {
                const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                setItems((prev) => [...prev, { key, alias: "", type: "" }]);
                setOpenMap((prev) => ({ ...prev, [key]: true }));
              }}
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
