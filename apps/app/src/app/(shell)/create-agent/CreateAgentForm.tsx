'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "~/lib/queryClient"; 
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@hebo/ui/components/DropdownMenu";
import { ChevronDown } from "lucide-react";

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

  const createAgentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: data.agentName,
          models: [data.selectedModel],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: (newAgent) => {
      console.log('Created agent:', newAgent);
      queryClient.invalidateQueries({ queryKey: ['agents'] }); // optional if you query agents list somewhere
      router.push('/');
    },
    onError: (error: any) => {
      alert(error.message || 'Something went wrong');
    }
  });

  const handleSubmitForm = (data: FormValues) => {
    createAgentMutation.mutate(data);
  };

  const handleModelSelect = (modelName: string) => {
    setValue("selectedModel", modelName);
  };

  return (
    <div className="h-screen flex items-center justify-center overflow-hidden">
      <div className="max-w-lg w-full p-6">
      {/* Title */}
      <h1 className="text-3xl font-semibold mb-4">Create a new agent</h1>
      
      {/* Description */}
      <p className="text-gray-600 mb-8 text-[16px]">
        Each agent has its own model configuration and API keys. Learn more about which model to choose based on Use Case
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
        {/* Agent Name Field */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="agent-name" className="w-full sm:w-32 text-sm font-medium">
            Agent Name
          </label>
          <div className="flex-1 max-w-[320px]">
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
              <div role="alert" className="text-red-600 text-sm mt-1">{errors.agentName.message}</div>
            )}
          </div>
        </div>

        {/* Default Model Field */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="model-select" className="w-full sm:w-32 text-sm font-medium">
            Default Model
          </label>
          <div className="flex-1 max-w-[320px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  aria-label="Select a model"
                  aria-invalid={!!errors.selectedModel}
                >
                  {selectedModelData ? (
                    `${selectedModelData.modelName} (${Math.floor(selectedModelData.freeTokensPerMonth / 1000000)}M Free Tokens / Month)`
                  ) : (
                    "Select a model"
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[300px]">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.modelName}
                    onClick={() => handleModelSelect(model.modelName)}
                    className="cursor-pointer"
                  >
                    {model.modelName} ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens / Month)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.selectedModel && (
              <div role="alert" className="text-red-600 text-sm mt-1">{errors.selectedModel.message}</div>
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
    </div>
  );
};

export default CreateAgentForm;
