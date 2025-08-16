"use client";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import supportedModels from "@hebo/shared-data/supported-models.json";
import { Button } from "@hebo/ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hebo/ui/components/Form";
import { Input } from "@hebo/ui/components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hebo/ui/components/Select";

import { api, queryClient, useEdenMutation } from "~/lib/data";

import type { JSONSchemaType } from "ajv";

const FormSchema = Type.Object({
  agentName: Type.String({
    minLength: 1,
    default: "",
    errorMessage: "Please enter an agent name",
  }),
  defaultModel: Type.String({
    default: supportedModels[0].name,
  }),
});

type FormData = Static<typeof FormSchema>;

export function AgentForm() {
  const form = useForm<FormData>({
    resolver: ajvResolver(FormSchema as unknown as JSONSchemaType<FormData>),
    defaultValues: Value.Create(FormSchema) as FormData,
  });

  const navigate = useNavigate();

  const { mutate, error, isPending } = useEdenMutation({
    mutationFn: (values: FormData) =>
      api.agents.post({
        name: values.agentName,
        models: [values.defaultModel],
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate(`/agent/${(data as any).slug}`, { replace: true, viewTransition: true });
    },
  });

  return (
    <Card className="max-w-lg border-none bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>Create a new agent</CardTitle>
        <CardDescription>
          Each agent has its own model configuration and API keys. Learn more
          about which model to choose based on Use Case.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            {/* Agent Name Field */}
            <FormField
              control={form.control}
              name="agentName"
              render={({ field }) => (
                <FormItem className="sm:grid sm:grid-cols-[auto_1fr]">
                  <FormLabel className="sm:w-32">Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Set an agent name" {...field} />
                  </FormControl>
                  <FormMessage className="sm:col-start-2" />
                </FormItem>
              )}
            />

            {/* Default Model Field */}
            <FormField
              control={form.control}
              name="defaultModel"
              render={({ field }) => (
                <FormItem className="sm:grid sm:grid-cols-[auto_1fr]">
                  <FormLabel className="sm:w-32">Default Model</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder="Select a model"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedModels.map((model) => (
                          <SelectItem
                            key={model.name}
                            value={model.name}
                            className="truncate"
                          >
                            {model.displayName}
                            <span className="text-xs">
                              (
                              {new Intl.NumberFormat("en", {
                                notation: "compact",
                                compactDisplay: "short",
                                maximumFractionDigits: 1,
                              }).format(model.rateLimit)}{" "}
                              free tokens / month)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="sm:col-start-2" />
                </FormItem>
              )}
            />

            {/* Mutation Error Display */}
            {error && (
              <div className="text-destructive text-right" role="alert">
                {error.message}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isPending}
                aria-label="Create Agent"
              >
                Create
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
