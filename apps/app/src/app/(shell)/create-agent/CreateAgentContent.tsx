'use client';
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export type CreateAgentContentProps = {
  models: { modelName: string; freeTokensPerMonth: number }[];
};

type FormValues = {
  agentName: string;
  selectedModel: string;
};

const CreateAgentContent: React.FC<CreateAgentContentProps> = ({ models }) => {
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

  const onSubmit = async (data: FormValues) => {
    try {
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
        alert(`Failed to create agent: ${err.error}`);
        return;
      }
  
      const newAgent = await response.json();
      console.log('Created agent:', newAgent);
      router.push('/');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Something went wrong.');
    }
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
        <button type="submit" aria-label="Create Agent and go to home">
          Create
        </button>
      </div>
    </form>
  );
};

export default CreateAgentContent; 