'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "~/lib/queryClient"; // adjust path if needed

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

  const onSubmit = (data: FormValues) => {
    createAgentMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="agent-name">Agent Name</label>
        <input
          id="agent-name"
          type="text"
          {...register("agentName", { required: "Please enter an agent name" })}
          aria-label="Agent Name"
          aria-invalid={!!errors.agentName}
        />
        {errors.agentName && (
          <div role="alert">{errors.agentName.message}</div>
        )}
      </div>

      <div>
        <label htmlFor="model-select">Default Model</label>
        <select
          id="model-select"
          {...register("selectedModel", { required: "Please select a model" })}
          aria-label="Select a model"
          aria-invalid={!!errors.selectedModel}
        >
          {models.map((model) => (
            <option key={model.modelName} value={model.modelName}>
              {model.modelName} ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens/Month)
            </option>
          ))}
        </select>
        {errors.selectedModel && (
          <div role="alert">{errors.selectedModel.message}</div>
        )}
      </div>

      <div>
        <button type="submit" aria-label="Create Agent and go to home" disabled={createAgentMutation.isPending}>
          {createAgentMutation.isPending ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default CreateAgentForm;
