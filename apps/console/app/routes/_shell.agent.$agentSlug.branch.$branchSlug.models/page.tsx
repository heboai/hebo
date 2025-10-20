import { Form, useActionData, useNavigation } from "react-router";
import { useEffect, useState } from "react";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { Edit } from "lucide-react";

import { Button } from "@hebo/shared-ui/components/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@hebo/shared-ui/components/Card";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@hebo/shared-ui/components/Form";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";

import { useActionDataErrorToast } from "~console/lib/errors";

import {
  EMPTY_MODEL,
  branchModelsFormSchema,
  supportedModels,
  type BranchModelsFormValues,
} from "./schema";

type BranchModelsPageProps = {
  agentSlug: string;
  branchSlug: string;
  models?: BranchModelsFormValues["models"];
};

export default function BranchModelsPage({ agentSlug, branchSlug, models = []}: BranchModelsPageProps) {
  const lastResult = useActionData();
  const navigation = useNavigation();

  useActionDataErrorToast();

  const initialModels =
    models.length > 0
      ? models.map((model) => {
          const endpoint = model.endpoint ?? EMPTY_MODEL.endpoint;
          return {
            alias: model.alias,
            type: model.type,
            endpoint: {
              mode: endpoint.mode,
              baseUrl: endpoint.baseUrl,
              apiKey: endpoint.apiKey,
            },
          };
        })
      : [
          {
            ...EMPTY_MODEL,
            endpoint: { ...EMPTY_MODEL.endpoint },
          },
        ];

  const [form, fields] = useForm<BranchModelsFormValues>({
    lastResult,
    constraint: getValibotConstraint(branchModelsFormSchema),
    defaultValue: {
      models: initialModels,
    },
  });

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  useEffect(() => {
    if (form.status === "success") {
      setExpandedCardId(null);
    }
  }, [form.status]);

  const modelItems = fields.models.getFieldList();

  const selectItems = supportedModels.map((item) => ({
    value: item.name,
    name: `${item.displayName} (${item.name})`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Model Configuration
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Configure access for agents to different models and their routing
          behaviour. Connect existing inference endpoints or choose from our
          managed providers.
        </p>
      </div>

      <Form method="patch" {...getFormProps(form)} className="space-y-4">
        {modelItems.map((modelField, index) => {
          const cardFieldset = modelField.getFieldset();
          const endpointFieldset = cardFieldset.endpoint.getFieldset();

          const cardId = modelField.key ?? `index:${index}`;
          const isExpanded = expandedCardId === cardId;

          const aliasValue =
            (cardFieldset.alias.value as string | undefined) ?? "";
          const aliasPath = [agentSlug, branchSlug, aliasValue || "alias"]
            .filter(Boolean)
            .join("/");

          const modelType =
            (cardFieldset.type.value as string | undefined) ?? EMPTY_MODEL.type;
          const mode =
            (endpointFieldset.mode.value as "custom" | "managed" | undefined) ??
            "managed";
          const isCustomEndpoint = mode === "custom";

          return (
            <Card
              key={cardId}
              className="border-border/60 bg-card/70 shadow-sm"
            >
              <CardHeader className="gap-3 border-b border-border/60 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Alias path
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {aliasPath}
                      </span>
                      <CopyToClipboardButton
                        className="h-7 w-7 rounded-md border border-border p-1 transition hover:bg-muted"
                        textToCopy={aliasPath}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
                      {
                        supportedModels.find((model) => model.name === modelType)
                          ?.displayName ?? modelType
                      }
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
                      {isCustomEndpoint ? "Custom Endpoint" : "Managed"}
                    </span>
                    {!isExpanded ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 gap-2 px-3"
                        onClick={() => setExpandedCardId(cardId)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <div
                className={`grid overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
                aria-hidden={!isExpanded}
              >
                <div className="min-h-0">
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        field={cardFieldset.alias}
                        className="flex flex-col gap-2"
                      >
                        <FormLabel>Alias</FormLabel>
                        <FormControl>
                          <Input placeholder="embeddings" autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormField>

                      <FormField
                        field={cardFieldset.type}
                        className="flex flex-col gap-2"
                      >
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select items={selectItems} />
                        </FormControl>
                        <FormMessage />
                      </FormField>
                    </div>

                    <FormField
                      field={endpointFieldset.mode}
                      className="space-y-3"
                    >
                      <FormControl>
                        <input type="hidden" value={mode} readOnly />
                      </FormControl>
                      <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              form.update({
                                name: endpointFieldset.mode.name,
                                value: isCustomEndpoint ? "managed" : "custom",
                                validated: false,
                              })
                            }
                            className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-pressed={isCustomEndpoint}
                            aria-label="Toggle custom endpoint"
                          >
                            <span
                              className={`absolute inset-0 m-0.5 rounded-full transition-colors ${
                                isCustomEndpoint ? "bg-primary" : "bg-transparent"
                              }`}
                            />
                          </button>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              Custom Endpoint
                            </span>
                            <p className="text-muted-foreground text-xs">
                              Route this alias to your own inference endpoint.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {isCustomEndpoint ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormField>

                    <div
                      className={`grid gap-4 sm:grid-cols-2 ${
                        isCustomEndpoint ? "opacity-100" : "opacity-60"
                      }`}
                      aria-hidden={!isCustomEndpoint}
                    >
                      <FormField
                        field={endpointFieldset.baseUrl}
                        className="flex flex-col gap-2"
                      >
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://"
                            autoComplete="off"
                            disabled={!isCustomEndpoint}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormField>

                      <FormField
                        field={endpointFieldset.apiKey}
                        className="flex flex-col gap-2"
                      >
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="API key"
                            type="password"
                            autoComplete="off"
                            disabled={!isCustomEndpoint}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormField>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      className="self-start text-destructive hover:text-destructive"
                      disabled={modelItems.length === 1}
                      onClick={() => {
                        form.remove({
                          name: fields.models.name,
                          index,
                        });
                        if (expandedCardId === cardId) {
                          setExpandedCardId(null);
                        }
                      }}
                    >
                      Remove
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setExpandedCardId(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={navigation.state !== "idle"}
                      >
                        Save
                      </Button>
                    </div>
                  </CardFooter>
                </div>
              </div>
            </Card>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextIndex = modelItems.length;
            setExpandedCardId(`index:${nextIndex}`);
            form.insert({
              name: fields.models.name,
              defaultValue: EMPTY_MODEL
            });
          }}
        >
          + Add Model
        </Button>
      </Form>
    </div>
  );
}
