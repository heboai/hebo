"use client";

import { useFetcher } from "react-router";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { object, string, nonEmpty, pipe, trim, message } from "valibot";

import { Button } from "@hebo/shared-ui/components/Button";
import { CardContent, CardFooter } from "@hebo/shared-ui/components/Card";
import { Input } from "@hebo/shared-ui/components/Input";
import { Select } from "@hebo/shared-ui/components/Select";
import { FormField, FormLabel, FormControl, FormMessage } from "@hebo/shared-ui/components/Form";

type SupportedModel = { name: string; displayName?: string };

const BranchConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a model alias"),
  modelType: message(pipe(string(), trim(), nonEmpty()), "Please select a model type"),
});

export type BranchModelFormProps = {
  defaultModel?: { alias: string; type: string } | undefined;
  supportedModels: SupportedModel[];
  onCancel: () => void;
};

export function BranchModelForm({ defaultModel, supportedModels, onCancel }: BranchModelFormProps) {
  const fetcher = useFetcher<any>();

  const [form, fields] = useForm<{ alias: string; modelType: string }>({
    defaultValue: {
      alias: defaultModel ? defaultModel.alias : "",
      modelType: defaultModel ? defaultModel.type : "",
    },
    onValidate({ formData }: { formData: FormData }) {
      return parseWithValibot(formData, { schema: BranchConfigSchema });
    },
    lastResult: fetcher.data?.lastResult,
  });

  return (
    <fetcher.Form method="post" {...getFormProps(form)} className="contents">
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <FormField field={fields.alias} className="contents">
            <div className="flex-1">
              <FormLabel>Model Alias</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter model alias"
                  name={fields.alias.name}
                  defaultValue={fields.alias.initialValue}
                  id={fields.alias.id}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>

          <FormField field={fields.modelType} className="contents">
            <div className="flex-1">
              <FormLabel>Model Type</FormLabel>
              <FormControl>
                <Select
                  name={fields.modelType.name}
                  defaultValue={fields.modelType.initialValue}
                  placeholder="Select a model type"
                  items={[
                    ...supportedModels.map((model) => ({
                      value: model.name,
                      name: (
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                        </div>
                      ),
                    })),
                  ]}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormField>
        </div>
        {fetcher.data?.error && (
          <div className="text-destructive text-sm">{fetcher.data?.error}</div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="submit"
          name="intent"
          value="remove"
          variant="destructive"
          isLoading={fetcher.state !== "idle"}
        >
          Remove
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            name="intent"
            value="save"
            isLoading={fetcher.state !== "idle"}
            disabled={!fields.modelType.value}
          >
            Save
          </Button>
        </div>
      </CardFooter>
    </fetcher.Form>
  );
}


