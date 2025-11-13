import { Form, useActionData, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useForm, getFormProps, type FieldMetadata } from "@conform-to/react";
import { getValibotConstraint } from "@conform-to/valibot";
import { Brain, Edit } from "lucide-react";

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
  modelsConfigFormSchema,
  supportedModels,
  type ModelConfigFormValue,
  type ModelsConfigFormValues,
} from "./schema";


type ModelsConfigProps = {
  agentSlug: string;
  branchSlug: string;
  models?: ModelsConfigFormValues["models"];
};

export default function ModelsConfigForm({ agentSlug, branchSlug, models }: ModelsConfigProps) {
  const lastResult = useActionData();
  const navigation = useNavigation();

  useActionDataErrorToast();

  const [form, fields] = useForm<ModelsConfigFormValues>({
    lastResult,
    constraint: getValibotConstraint(modelsConfigFormSchema),
    defaultValue: { models: models }
  });

  const formRef = useRef<HTMLFormElement>(null);

  const modelItems = fields.models.getFieldList();

  // Close the active card on successful submit
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  useEffect(() => {
    if (navigation.state === "idle" && form.status === "success") {
      setExpandedCardId(null);
    }
  }, [navigation.state, form.status]);

  return (
    <Form method="post" ref={formRef} {...getFormProps(form)} className="contents">
      {modelItems.map((model, index) => (
        <ModelCard
          key={model.key}
          model={model}
          agentSlug={agentSlug}
          branchSlug={branchSlug}
          isExpanded={expandedCardId === index}
          onExpand={() => setExpandedCardId(index)}
          onRemove={() => {
            // FUTURE: confirm removal as it is a irreversible action
            form.remove({ name: fields.models.name, index })
            // FUTURE: this is a quirk to work around a current Conform limitation. 
            // Remove once upgrade to future APIs in conform 1.9+
            setTimeout(() => formRef.current?.requestSubmit(), 100);
            setExpandedCardId(null);
          }}
          onCancel={() => {
            form.reset({ name: fields.models.name });
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
  model: FieldMetadata<ModelConfigFormValue>;
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

  const aliasPath = [agentSlug, branchSlug, modelFieldset.alias.value || "alias"].join("/");

  return (
    <Card className="gap-0">
      <CardHeader>
        <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:gap-8 sm:items-center">
          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <span className="text-xs uppercase text-muted-foreground">Alias path</span>
            <div className="inline-flex gap-2 items-center">
              <span className="text-sm font-medium text-ellipsis-start">{aliasPath}</span>
              <CopyToClipboardButton textToCopy={aliasPath} />
            </div>
          </div>

          {/* FUTURE: left-align badges across multiple cards */ }
          <Badge variant="outline">
            <Brain />
            {supportedModels.find((m) => m.name === modelFieldset.type.value)?.displayName || ""}
          </Badge>

          <Button type="button" variant="outline" onClick={onExpand} disabled={isExpanded}>
            <Edit />
            Edit
          </Button>
        </div>
      </CardHeader>

      {/* FUTURE: use Collapsible component for better accessibility */}
      <div
        className={`grid overflow-hidden m-0 transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0">
          <Separator className="mt-4" />

          <CardContent className="flex flex-col gap-4 my-4">

            {/* FUTURE: follow layout pattern of new shadcn fields components */}
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
                    placeholder="Select the model"
                  />
                </FormControl>
                <FormMessage />
              </FormField>
            </div>
          </CardContent>

          <CardFooter className="pb-1">
            <Button type="button" variant="destructive" onClick={onRemove} disabled={isSubmitting}>
              Remove
            </Button>

            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
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
