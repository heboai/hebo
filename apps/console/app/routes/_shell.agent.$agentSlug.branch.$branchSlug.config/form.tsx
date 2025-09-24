"use client";

import { useEffect, useMemo, useState } from "react";
import { Form, useActionData, useNavigation, useParams, useRouteLoaderData } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { object, array, string, nonEmpty, pipe, trim, message, type InferOutput } from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";

import { Button } from "@hebo/shared-ui/components/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hebo/shared-ui/components/Collapsible";
import { Card } from "@hebo/shared-ui/components/Card";
import { CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { Label } from "@hebo/shared-ui/components/Label";
import { Split } from "lucide-react";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";

import { useActionDataErrorToast } from "~console/lib/errors";


type Model = { alias: string; type: string };

export const BranchModelsSchema = object({
  models: array(
    object({
      alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
      type: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
    })
  ),
});
export type BranchModelsFormValues = InferOutput<typeof BranchModelsSchema>;

const getModelDisplayName = (modelName: string): string => {
  if (modelName === "custom") {
    return "Custom Model";
  }
  const model = supportedModels.find((m) => m.name === modelName);
  return model?.displayName || modelName;
};

export default function ModelConfigurationForm() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const { agent } = useRouteLoaderData<{
    agent: {
      branches: Array<{
        models: Array<{ alias: string; type: string }>;
      }>;
    };
  }>("routes/_shell.agent.$agentSlug")!;
  const { agentSlug, branchSlug } = useParams<{ agentSlug: string; branchSlug: string }>();
  const activeBranch = agent.branches[0];
  const initialModels = activeBranch.models;

  type Item = { key: string; alias: string; type: string; originalAlias?: string };
  const [items, setItems] = useState<Array<Item>>(() =>
    initialModels.map((m) => ({ key: `existing-${m.alias}`, alias: m.alias, type: m.type, originalAlias: m.alias }))
  );

  // Keep local items in sync if loader data changes (e.g., after navigation)
  useEffect(() => {
    setItems(initialModels.map((m) => ({ key: `existing-${m.alias}`, alias: m.alias, type: m.type, originalAlias: m.alias })));
  }, [initialModels]);

  const actionData = useActionData<any>();
  useActionDataErrorToast();
  const navigation = useNavigation();

  const defaultValue = useMemo<BranchModelsFormValues>(() => ({
    models: items.map((i) => ({ alias: i.alias, type: i.type })),
  }), [items]);

  const [form] = useForm<BranchModelsFormValues>({
    defaultValue,
    constraint: getValibotConstraint(BranchModelsSchema),
    lastResult: actionData,
    shouldValidate: "onBlur",
  });

  const isSubmitting = navigation.state === "submitting";
  const currentIntent = String(navigation.formData?.get("intent") || "");

  return (
    <div className="absolute inset-0 flex justify-center">
      <div className="max-w-2xl min-w-0 w-full border-none bg-transparent shadow-none px-4 sm:px-6 md:px-0">
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
          <input type="hidden" name="currentModels" value={JSON.stringify(initialModels)} />
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
                                    defaultValue={item.alias}
                                    onChange={(e) =>
                                      setItems((prev) => prev.map((it, idx) => idx === index ? { ...it, alias: e.target.value } : it))
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="py-1.5">Model Type</Label>
                                  <Select
                                    name={`modelsUI[${index}].type`}
                                    placeholder="Select a model type"
                                    defaultValue={item.type}
                                    items={supportedModels.map((model: { name: string; displayName?: string }) => ({
                                      value: model.name,
                                      name: model.displayName,
                                    }))}
                                    aria-label="Model type"
                                  />
                                  <input type="hidden" name={`models[${index}].type`} value={item.type} />
                                  <input type="hidden" name={`models[${index}]._originalAlias`} value={item.originalAlias ?? ""} />
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
                                  value="save"
                                  isLoading={isSubmitting && currentIntent === "save"}
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