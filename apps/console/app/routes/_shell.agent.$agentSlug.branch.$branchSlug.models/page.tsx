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
  branchModelsFormSchema,
  supportedModels,
  type BranchModelsFormValues,
} from "./schema";


type BranchModelsPageProps = {
  agentSlug: string;
  branchSlug: string;
  models?: BranchModelsFormValues["models"];
};

export default function BranchModelsPage({ agentSlug, branchSlug, models }: BranchModelsPageProps) {
  const lastResult = useActionData();
  const navigation = useNavigation();

  useActionDataErrorToast();

  const [form, fields] = useForm<BranchModelsFormValues>({
    lastResult,
    constraint: getValibotConstraint(branchModelsFormSchema),
    defaultValue: {
      models: models
    }
  });

  const modelItems = fields.models.getFieldList();

  // Close the active card on successful submit
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  useEffect(() => {
    if (form.status === "success") {
      setExpandedCardId(null);
    }
  }, [form.status]);

  return (
    <Form method="patch" {...getFormProps(form)} className="space-y-4">
      {modelItems.map((model, index) => {

        const modelFieldset = model.getFieldset();
        const endpointField = modelFieldset.endpoint;
        const endpointFieldset = endpointField.getFieldset();
        const endpointValue = endpointField.value as
          | { baseUrl: string; apiKey: string }
          | undefined;

        const isExpanded = expandedCardId === index;

        const aliasPath = [agentSlug, branchSlug, modelFieldset.alias.value || "alias"].join("/");

        const isCustomEndpoint = Boolean(
          endpointValue?.baseUrl?.trim() || endpointValue?.apiKey?.trim()
        );

        return (
          <Card
            key={model.key}
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
                      supportedModels.find((model) => model.name === modelFieldset.type.value)?.displayName || ""
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
                      onClick={() => setExpandedCardId(index)}
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
                      field={modelFieldset.alias}
                      className="flex flex-col gap-2"
                    >
                      <FormLabel>Alias</FormLabel>
                      <FormControl>
                        <Input placeholder="embeddings" autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormField>

                    <FormField
                      field={modelFieldset.type}
                      className="flex flex-col gap-2"
                    >
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select items={supportedModels.map((item) => ({
                          value: item.name,
                          name: item.displayName,
                        }))} />
                      </FormControl>
                      <FormMessage />
                    </FormField>
                  </div>

                  <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
                    <input
                      id={`${endpointField.id}-checkbox`}
                      type="checkbox"
                      checked={isCustomEndpoint}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        form.update({
                          name: endpointField.name,
                          value: checked
                            ? {
                                baseUrl: endpointValue?.baseUrl ?? "",
                                apiKey: endpointValue?.apiKey ?? "",
                              }
                            : undefined,
                          validated: false,
                        });
                      }}
                      className="size-4 shrink-0 rounded border border-input"
                    />
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-sm font-medium text-foreground"
                        htmlFor={`${endpointField.id}-checkbox`}
                      >
                        Use custom endpoint
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Route this alias to your own inference endpoint.
                      </p>
                    </div>
                  </div>

                  {isCustomEndpoint ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        field={endpointFieldset.baseUrl}
                        className="flex flex-col gap-2"
                      >
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" autoComplete="off" />
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormField>
                    </div>
                  ) : null}
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
                      setExpandedCardId(null);
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
          form.insert({ name: fields.models.name });
          setExpandedCardId(modelItems.length);
        }}
      >
        + Add Model
      </Button>
    </Form>
  );
}
