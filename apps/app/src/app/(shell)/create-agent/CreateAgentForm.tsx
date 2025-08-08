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
    <Card className="card border-none bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="card-title">Create a new agent</CardTitle>
        <CardDescription>
          Each agent has its own model configuration and API keys. Learn more
          about which model to choose based on Use Case
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            {/* Agent Name Field */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
              <Label htmlFor="agent-name" className="sm:w-32">
                Agent Name
              </Label>
              <div className="w-full max-w-xs space-y-1">
                <div className="w-full bg-white">
                  <Input
                    id="agent-name"
                    type="text"
                    placeholder="Name"
                    className="w-full"
                    aria-invalid={!!errors.agentName}
                    {...register("agentName", {
                      required: "Please enter an agent name",
                    })}
                  />
                </div>
                {errors.agentName && (
                  <div className="text-destructive" role="alert">
                    {errors.agentName.message}
                  </div>
                )}
              </div>
            </div>

            {/* Default Model Field */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
              <Label htmlFor="model-select" className="sm:w-32">
                Default Model
              </Label>
              <div className="w-full max-w-xs space-y-1">
                <div className="w-full bg-white">
                  <Controller
                    control={control}
                    name="defaultModel"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                </div>
                {errors.defaultModel && (
                  <div className="text-destructive" role="alert">
                    {errors.defaultModel.message}
                  </div>
                )}
              </div>
            </div>

            {/* Mutation Error Display */}
            {error && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
                <div className="sm:w-32"></div>
                <div className="space-y-1">
                  <div className="text-destructive" role="alert">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-label="Create Agent and go to home"
              >
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
