import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useForm, getFormProps, type FieldMetadata } from "@conform-to/react";
import { getZodConstraint } from "@conform-to/zod/v4";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hebo/shared-ui/components/Dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hebo/shared-ui/components/Collapsible";

import { useFormErrorToast } from "~console/lib/errors";
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
  
  const fetcher = useFetcher();
  const [form, fields] = useForm<ModelsConfigFormValues>({
    lastResult: fetcher.data,
    constraint: getZodConstraint(modelsConfigFormSchema),
    defaultValue: { models: models }
  });
  useFormErrorToast(form.allErrors);

  // Close the active card on successful submit
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  useEffect(() => {
    console.log(`${fetcher.state} ${form.status}`);
    if (fetcher.state === "idle" && form.status === "success") {
      setExpandedCardId(null);
    }
  }, [fetcher.state, form.status]);

  const formRef = useRef<HTMLFormElement>(null);
  const modelItems = fields.models.getFieldList();

  return (
    <fetcher.Form method="post" ref={formRef} {...getFormProps(form)} className="contents">
      {modelItems.map((model, index) => (
        <ModelCard
          key={model.key}
          model={model}
          agentSlug={agentSlug}
          branchSlug={branchSlug}
          isExpanded={expandedCardId === index}
          onOpenChange={(open) => { 
            form.dirty && form.reset({ name: fields.models.name  });
            open && setExpandedCardId(index);
          }}
          onRemove={() => {
            setExpandedCardId(null);
            form.remove({ name: fields.models.name, index })
            // FUTURE: this is a quirk to work around a current Conform limitation. 
            // Remove once upgrade to future APIs in conform 1.9+
            setTimeout(() => formRef.current?.requestSubmit(), 1000);
          }}
          onCancel={() => {
            form.dirty && form.reset({ name: fields.models.name  });
            setExpandedCardId(null);
          }}
          isSubmitting={fetcher.state === "submitting"}
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
          disabled={expandedCardId !== null}
        >
          + Add Model
        </Button>
      </div>
    </fetcher.Form>
  );
}


function ModelCard(props: {
  model: FieldMetadata<ModelConfigFormValue>;
  agentSlug: string;
  branchSlug: string;
  isExpanded: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    model,
    agentSlug,
    branchSlug,
    isExpanded,
    onOpenChange,
    onRemove,
    onCancel,
    isSubmitting,
  } = props;

  const modelFieldset = model.getFieldset();

  const aliasPath = [agentSlug, branchSlug, modelFieldset.alias.value || "alias"].join("/");

  return (
    <Collapsible open={isExpanded} onOpenChange={onOpenChange}>
      <Card className="gap-0">
        <CardHeader>
          <div className="grid gap-4 min-w-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs uppercase text-muted-foreground">Alias path</span>
              <div className="inline-flex gap-2 items-center">
                <span className="text-sm font-medium text-ellipsis-start">{aliasPath}</span>
                <CopyToClipboardButton textToCopy={aliasPath} />
              </div>
            </div>

            <Badge variant="outline">
              <Brain />
              {supportedModels.find((m) => m.name === modelFieldset.type.value)?.displayName || "undefined"}
            </Badge>

            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" disabled={isExpanded}>
                <Edit />
                Edit
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent 
          forceMount
          inert={!isExpanded}
          className="
            overflow-hidden
            data-[state=closed]:[animation:collapsible-up_300ms_ease-in]
            data-[state=closed]:h-0
            "
          >
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

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove model</DialogTitle>
                    <DialogDescription>
                      This action permanently removes the model and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={onRemove}
                      isLoading={isSubmitting}
                    >
                      Remove
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!model.dirty} isLoading={isSubmitting}>
                  Save
                </Button>
              </div>
            </CardFooter>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
