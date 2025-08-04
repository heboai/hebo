'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useCreateAgent } from "~/lib/data/agents";
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@hebo/ui/components/Select";

export type CreateAgentFormProps = {
  models: { modelName: string; freeTokensPerMonth: number }[];
};

type FormValues = {
  agentName: string;
  selectedModel: string;
};

const CreateAgentForm: React.FC<CreateAgentFormProps> = ({ models }) => {
  const router = useRouter();
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
  const selectedModelData = models.find(model => model.modelName === selectedModel);

  const createAgentMutation = useCreateAgent();

  const handleSubmitForm = (data: FormValues) => {
    createAgentMutation.mutate(
      {
        agentName: data.agentName,
        models: [data.selectedModel],
      },
      {
        onSuccess: () => {
          router.push('/');
        },
        onError: (error: any) => {
          alert(error.message || 'Something went wrong');
        }
      }
    );
  };

  const handleModelSelect = (modelName: string) => {
    setValue("selectedModel", modelName);
  };

  return (
    <div className="max-w-lg w-full p-6">
      {/* Title */}
      <h1 className="mb-4">Create a new agent</h1>
      
      {/* Description */}
      <p className="text-gray-600 mb-8">
        Each agent has its own model configuration and API keys. Learn more about which model to choose based on Use Case
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
        {/* Agent Name Field */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-center gap-2 sm:gap-4">
          <label htmlFor="agent-name" className="sm:w-32">
            Agent Name
          </label>
          <div className="space-y-1">
            <Input
              id="agent-name"
              type="text"
              placeholder="Name"
              className="bg-white"
              aria-label="Agent Name"
              aria-invalid={!!errors.agentName}
              {...register("agentName", { required: "Please enter an agent name" })}
            />
            {errors.agentName && (
              <div role="alert" className="text-destructive">{errors.agentName.message}</div>
            )}
          </div>
        </div>

        {/* Default Model Field */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] sm:items-center gap-2 sm:gap-4">
          <label htmlFor="model-select" className="sm:w-32">
            Default Model
          </label>
          <div className="space-y-1">
            <Select value={selectedModel} onValueChange={handleModelSelect}>
              <SelectTrigger 
                id="model-select"
                className="w-full max-w-80 bg-white"
                aria-label="Select a model"
                aria-invalid={!!errors.selectedModel}
              >
                <SelectValue placeholder="Select a model" className="truncate" />
              </SelectTrigger>
              <SelectContent className="w-full min-w-xs">
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
            {errors.selectedModel && (
              <div role="alert" className="text-destructive">{errors.selectedModel.message}</div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={createAgentMutation.isPending}
            aria-label="Create Agent and go to home"
          >
            {createAgentMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAgentForm;
