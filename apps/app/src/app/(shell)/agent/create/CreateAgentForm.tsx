"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

import { Button } from "@hebo/ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";
import { Input } from "@hebo/ui/components/Input";
import { Label } from "@hebo/ui/components/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hebo/ui/components/Select";

import { supportedModels } from "~/config/models";
import { api, queryClient, useEdenMutation } from "~/lib/data";

// FUTURE: Implement TypeBox Validation
type FormData = {
  agentName: string;
  defaultModel: string;
};

export function CreateAgentForm() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      agentName: "",
      defaultModel: supportedModels[0].modelName,
    },
  });

  const router = useRouter();

  const { mutate, error, isPending } = useEdenMutation({
    mutationFn: (values: FormData) =>
      // @ts-expect-error: API type not ready
      api.agents.post({
        name: values.agentName,
        models: [values.defaultModel],
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      // FUTURE: implement wrapper for router to apply ViewTransitions
      // @ts-expect-error: API type not ready
      router.replace(`/agent/${data.id}`);
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
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          aria-busy={isPending}
        >
          {/* Agent Name Field */}
          <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr]">
            <Label htmlFor="agent-name" className="sm:w-32">
              Agent Name
            </Label>
            <div className="sm:max-w-xs">
              {/* FUTURE: Autofocus on load and validation error */}
              <Input
                id="agent-name"
                type="text"
                placeholder="Name"
                disabled={isPending}
                aria-invalid={!!errors.agentName}
                aria-describedby={
                  errors.agentName ? "agent-name-error" : undefined
                }
                {...register("agentName", {
                  required: "Please enter an agent name",
                })}
              />
              {errors.agentName && (
                <div
                  id="agent-name-error"
                  className="text-destructive"
                  role="alert"
                >
                  {errors.agentName.message}
                </div>
              )}
            </div>

            {/* Default Model Field */}
            <Label htmlFor="model-select" className="sm:w-32">
              Default Model
            </Label>
            <div className="sm:max-w-xs">
              {/* FUTURE: Consider to generalize Controller into Select component */}
              <Controller
                control={control}
                name="defaultModel"
                rules={{ required: "Please select a default model" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="model-select"
                      className="w-full"
                      aria-invalid={!!errors.defaultModel}
                      aria-describedby={
                        errors.defaultModel ? "default-model-error" : undefined
                      }
                    >
                      <SelectValue
                        placeholder="Select a model"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedModels.map((model) => (
                        <SelectItem
                          key={model.modelName}
                          value={model.modelName}
                          className="truncate"
                        >
                          {model.modelName} (
                          {Math.floor(model.freeTokensPerMonth / 1_000_000)}M
                          Free Tokens / Month)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.defaultModel && (
                <div
                  id="default-model-error"
                  className="text-destructive"
                  role="alert"
                >
                  {errors.defaultModel.message}
                </div>
              )}
            </div>
          </div>

          {/* Mutation Error Display */}
          {error && (
            <div className="text-destructive text-right" role="alert">
              {error.message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            {/* FUTURE: Consider to generalize spinner into Button prop */}
            <Button
              type="submit"
              disabled={isPending}
              aria-label="Create Agent"
            >
              {isPending && (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              )}
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
