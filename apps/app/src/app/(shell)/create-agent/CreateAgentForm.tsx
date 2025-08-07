'use client';

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";
import { SupportedModel } from "~/config/models";
import { useCreateAgent } from "~/lib/data/agents";
import { queryClient } from '~/lib/data/queryClient';
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { Label } from "@hebo/ui/components/Label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@hebo/ui/components/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hebo/ui/components/Card";

export type CreateAgentFormProps = {
  models: SupportedModel[];
};

type FormValues = {
  agentName: string;
  selectedModel: string;
};

const CreateAgentFormContent: React.FC<CreateAgentFormProps> = ({ models }) => {
  const [mutationError, setMutationError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      agentName: "",
      selectedModel: models[0]?.modelName || "",
    },
  });

  const selectedModel = watch("selectedModel");

  const createAgentMutation = useCreateAgent();

  const handleSubmitForm = (data: FormValues) => {
    setMutationError(null); // Clear any previous errors
    createAgentMutation.mutate(
      {
        agentName: data.agentName,
        models: [data.selectedModel],
      },
      {
        onError: (error: Error) => {
          setMutationError(error.message || 'Something went wrong');
        }
      }
    );
  };

  const handleModelSelect = (modelName: string) => {
    setValue("selectedModel", modelName);
  };

  return (
    <Card className="bg-transparent border-none shadow-none card">
      <CardHeader>
        <CardTitle className="card-title">Create a new agent</CardTitle>
        <CardDescription>
          Each agent has its own model configuration and API keys. Learn more about which model to choose based on Use Case
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <div className="grid grid-cols-1 gap-4">
            {/* Agent Name Field */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-start gap-2 sm:gap-4">
              <Label htmlFor="agent-name" className="sm:w-32">
                Agent Name
              </Label>
              <div className="space-y-1 max-w-xs w-full">
                <div className="bg-white w-full">
                  <Input
                    id="agent-name"
                    type="text"
                    placeholder="Name"
                    className="w-full"
                    aria-invalid={!!errors.agentName}
                    {...register("agentName", { required: "Please enter an agent name" })}
                  />
                </div>
                {errors.agentName && (
                  <div className="text-destructive" role="alert">{errors.agentName.message}</div>
                )}
              </div>
            </div>

            {/* Default Model Field */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-start gap-2 sm:gap-4">
              <Label htmlFor="model-select" className="sm:w-32">
                Default Model
              </Label>
              <div className="space-y-1 max-w-xs w-full">
                <div className="bg-white w-full">
                  <Select value={selectedModel} onValueChange={handleModelSelect}>
                    <SelectTrigger 
                      id="model-select"
                      className="w-full"
                      aria-invalid={!!errors.selectedModel}
                    >
                      <SelectValue placeholder="Select a model" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem
                          key={model.modelName}
                          value={model.modelName}
                          className="truncate"
                        >
                          {model.modelName} ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens / Month)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.selectedModel && (
                  <div className="text-destructive" role="alert">{errors.selectedModel.message}</div>
                )}
              </div>
            </div>

            {/* Mutation Error Display */}
            {mutationError && (
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-center gap-2 sm:gap-4">
                <div className="sm:w-32"></div>
                <div className="space-y-1">
                  <div className="text-destructive" role="alert">{mutationError}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createAgentMutation.isPending}
                aria-label="Create Agent and go to home"
              >
                {createAgentMutation.isPending && <Loader2Icon className="animate-spin" />}
                {createAgentMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const CreateAgentForm: React.FC<CreateAgentFormProps> = ({ models }) => {
  return (
    <CreateAgentFormContent models={models} />
  );
};

export default CreateAgentForm;