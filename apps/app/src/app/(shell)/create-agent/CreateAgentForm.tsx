"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";

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

// FUTURE: Implement TypeBox Validation
type FormData = {
  agentName: string;
  defaultModel: string;
};

export function CreateAgentForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      agentName: "",
      defaultModel: supportedModels[0].modelName,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null);

    try {
      // TODO: Replace this with Eden Query Client
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: data.agentName,
          models: [data.defaultModel],
        }),
      });

      if (response.ok) {
        router.push("/");
      } else {
        const json = await response.json();
        setError(json.error);
      }
    } catch {
      setError("Unexpected error occurred.");
    }
  };

  return (
    <Card className="card max-w-lg border-none bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>Create a new agent</CardTitle>
        <CardDescription>
          Each agent has its own model configuration and API keys. Learn more
          about which model to choose based on Use Case.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Agent Name Field */}
          <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr]">
            <Label htmlFor="agent-name" className="sm:w-32">
              Agent Name
            </Label>
            <div className="sm:max-w-xs">
              <Input
                id="agent-name"
                type="text"
                placeholder="Name"
                aria-invalid={!!errors.agentName}
                {...register("agentName", {
                  required: "Please enter an agent name",
                })}
              />
              {errors.agentName && (
                <div className="text-destructive" role="alert">
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
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="model-select"
                      className="w-full"
                      aria-invalid={!!errors.defaultModel}
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
                <div className="text-destructive" role="alert">
                  {errors.defaultModel.message}
                </div>
              )}
            </div>
          </div>

          {/* Mutation Error Display */}
          {error && (
            <div className="text-destructive text-right" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            {/* FUTURE: Consider to generalize spinner into Button prop */}
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-label="Create Agent and go to home"
            >
              {isSubmitting && <Loader2Icon className="animate-spin" />}
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
