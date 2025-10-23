import { Form, useActionData, useNavigation } from "react-router";
import { useEffect, useState } from "react";
import { useForm, getFormProps } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { Brain, Edit, Split } from "lucide-react";

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
import { Separator } from "@hebo/shared-ui/components/Separator";
import { CopyToClipboardButton } from "@hebo/shared-ui/components/code/CopyToClipboardButton";
import { Badge } from "@hebo/shared-ui/components/Badge";

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
    defaultValue: { models },
  });

  const modelItems = fields.models.getFieldList();

  // Close the active card on successful submit
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  useEffect(() => {
    if (form.status === "success") setExpandedCardId(null);
  }, [form.status]);

  return (

    // FUTURE: should this actually use a fetcher form (since no navigation on save?)
    <Form method="post" {...getFormProps(form)} className="contents">
      {modelItems.map((model, index) => (
        <ModelCard
          key={model.key}
          model={model}
          agentSlug={agentSlug}
          branchSlug={branchSlug}
          isExpanded={expandedCardId === index}
          onExpand={() => setExpandedCardId(index)}
          onRemove={() => {
            form.remove({ name: fields.models.name, index });
            setExpandedCardId(null);
          }}
          onCancel={() => {
            form.reset();
            setExpandedCardId(null);
          }}
          isSubmitting={navigation.state === "submitting"}
        />
      ))}

      <div>
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
      </div>
    </Form>
  );
}


function ModelCard(props: {
  model: any;
  agentSlug: string;
  branchSlug: string;
  isExpanded: boolean;
  onExpand: () => void;
  onRemove: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    model,
    agentSlug,
    branchSlug,
    isExpanded,
    onExpand,
    onRemove,
    onCancel,
    isSubmitting,
  } = props;

  const modelFieldset = model.getFieldset();
  const endpointField = modelFieldset.endpoint;
  const endpointFieldset = endpointField.getFieldset();
  const endpointValue = endpointField.value as
    | { baseUrl: string; apiKey: string }
    | undefined;

  const aliasPath = [agentSlug, branchSlug, modelFieldset.alias.value || "alias"].join("/");

  const [isCustomEndpoint, setIsCustomEndpoint] = useState<boolean>(() =>
    Boolean(endpointValue?.baseUrl?.trim() || endpointValue?.apiKey?.trim())
  );

  return (
    <Card className="gap-0">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8 sm:items-center">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-xs uppercase text-muted-foreground">Alias path</span>
            <div className="flex gap-2">
              <span className="text-sm font-medium">{aliasPath}</span>
              <CopyToClipboardButton textToCopy={aliasPath} />
            </div>
          </div>

          <Badge variant="outline">
            <Brain />
            {supportedModels.find((m) => m.name === modelFieldset.type.value)?.displayName || ""}
          </Badge>

          <Badge variant="outline">
            <Split />
            {isCustomEndpoint ? "Custom Endpoint" : "Managed"}
          </Badge>

          <Button variant="outline" onClick={onExpand} disabled={isExpanded}>
            <Edit />
            Edit
          </Button>
        </div>
      </CardHeader>

      {/* FUTURE: use collapsible component for better accessibility */}
      <div
        className={`grid overflow-hidden m-0 transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0">
          <Separator className="mt-4" />

          <CardContent className="flex flex-col gap-4 my-4">

            {/* Future: follow layout pattern of new shadcn fields components */}
            <div className="grid gap-4 grid-cols-2">
              <FormField field={modelFieldset.alias} className="flex flex-col gap-2">
                <FormLabel>Alias</FormLabel>
                <FormControl>
                  <Input placeholder="Set alias name" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormField>

              <FormField field={modelFieldset.type} className="flex flex-col gap-2">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    items={supportedModels.map((item) => ({
                      value: item.name,
                      name: item.displayName,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormField>
            </div>

            {/* Future: follow layout pattern of new shadcn fields components, make whole field clickable */}
            <div className="flex gap-3 items-center rounded-md border px-3 py-2">
              <input
                id={`${endpointField.id}-checkbox`}
                type="checkbox"
                data-conform-ignore
                checked={isCustomEndpoint}
                onChange={(e) => setIsCustomEndpoint(e.target.checked)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`${endpointField.id}-checkbox`}>
                  Use custom endpoint
                </label>
                <p className="text-muted-foreground text-xs">
                  Route this alias to your own inference endpoint.
                </p>
              </div>
            </div>

            {isCustomEndpoint && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField field={endpointFieldset.baseUrl} className="flex flex-col gap-2">
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormField>

                <FormField field={endpointFieldset.apiKey} className="flex flex-col gap-2">
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="API key" type="password" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormField>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="button" variant="destructive" onClick={onRemove}>
              Remove
            </Button>

            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

