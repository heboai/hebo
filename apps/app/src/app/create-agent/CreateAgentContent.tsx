'use client';
import React, { useEffect } from "react";
import { Skeleton } from "@hebo/ui/components/Skeleton";
import { Button } from "@hebo/ui/components/Button";
import { Input } from "@hebo/ui/components/Input";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@hebo/ui/components/DropdownMenu";
import { proxy, useSnapshot } from 'valtio';
import { SquareArrowOutUpRight, ChevronDown } from "lucide-react";
import { agentStore } from "~/stores/agentStore";
import { createAgent } from "~/services/createAgent";
import { Loading } from "~/components/ui/LoadingSpinner";
import Link from "next/link";

export type CreateAgentContentProps = {
  models: { modelName: string; freeTokensPerMonth: number }[];
};

const state = proxy({
  isLoading: false,
  selectedModel: '',
  agentName: '',
  agentNameError: '',
  modelError: '',
});

const CreateAgentContent: React.FC<CreateAgentContentProps> = ({ models }) => {
  const snap = useSnapshot(state);
  const agentSnap = useSnapshot(agentStore);

  // Reset loading states on mount
  useEffect(() => {
    state.isLoading = false;
    agentStore.saving = false;
  }, []);

  useEffect(() => {
    if (models.length > 0 && !snap.selectedModel) {
      state.selectedModel = models[0].modelName;
    }
  }, [models, snap.selectedModel]);

  const handleCreateAgent = async () => {
    let hasError = false;
    if (!snap.selectedModel) {
      state.modelError = 'Please select a model';
      hasError = true;
    } else {
      state.modelError = '';
    }
    if (!snap.agentName) {
      state.agentNameError = 'Please enter an agent name';
      hasError = true;
    } else {
      state.agentNameError = '';
    }
    if (hasError) return;
    agentStore.newAgent = { name: snap.agentName, model: snap.selectedModel };
    agentStore.saving = true;
    agentStore.error = null;
    try {
      await createAgent({ name: snap.agentName, model: snap.selectedModel });
      agentStore.saving = false;
      // Optionally clear newAgent or redirect here
    } catch (err) {
      agentStore.saving = false;
      agentStore.error = (err as Error).message;
    }
  };

  return (
    <div className="max-w-2xl w-full" style={{ maxHeight: 285, maxWidth: 512 }}>
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Create a new agent</h1>
        <p className="text-gray-600">
          Each agent has its own model configuration and API keys. Learn more about which model to choose based on{' '}
          <a
            href="https://docs.hebo.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#4F46E5] font-semibold hover:underline rounded"
            aria-label="Learn more about which model to choose based on Use Case (opens in a new tab)"
            tabIndex={0}
          >
            Use Case
            <SquareArrowOutUpRight
              className="w-4 h-4 inline-block align-middle text-[#4F46E5]"
              aria-hidden="true"
            />
          </a>
        </p>
      </div>
      <div className="space-y-6">
        {/* Agent Name */}
        <div className="flex items-center justify-between">
          <label htmlFor="agent-name" className="text-base font-semibold text-gray-700">
            Agent Name
          </label>
          {snap.isLoading ? (
            <Skeleton className="w-80 h-10" />
          ) : (
            <>
              <Input
                type="text"
                id="agent-name"
                placeholder="Name"
                value={snap.agentName}
                onChange={e => {
                  state.agentName = e.target.value;
                  if (state.agentNameError) state.agentNameError = '';
                }}
                className="w-80 h-10 px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white text-gray-900"
                aria-label="Agent Name"
                aria-invalid={!!snap.agentNameError}
                disabled={agentSnap.saving}
              />
              {snap.agentNameError && (
                <div className="text-red-500 text-sm mt-1" aria-live="polite">{snap.agentNameError}</div>
              )}
            </>
          )}
        </div>
        {/* Model Selection */}
        <div className="flex items-center justify-between">
          <label htmlFor="model-select" className="text-base font-semibold text-gray-700">
            Default Model
          </label>
          <div className="w-80">
            {snap.isLoading ? (
              <Skeleton className="w-80 h-10" />
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      id="model-select"
                      aria-label="Select a model"
                      aria-invalid={!!snap.modelError}
                      disabled={agentSnap.saving}
                      className="w-80 h-10 justify-between"
                    >
                      {snap.selectedModel ? (
                        <div className="flex-1 min-w-0 text-left flex items-center">
                          <span className="font-medium text-base flex-1 min-w-0 truncate">
                            {models.find((m) => m.modelName === snap.selectedModel)?.modelName}
                          </span>
                          <span className="font-normal text-xs text-gray-500 whitespace-nowrap ml-2">
                            ({Math.floor((models.find((m) => m.modelName === snap.selectedModel)?.freeTokensPerMonth || 0) / 1000000)}M Free Tokens/Month)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 flex-1 text-left">Select a model</span>
                      )}
                      <ChevronDown className="h-5 w-5 text-black flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-60 overflow-auto">
                    {models.map((model) => (
                      <DropdownMenuItem
                        key={model.modelName}
                        onClick={() => {
                          state.selectedModel = model.modelName;
                          if (state.modelError) state.modelError = '';
                        }}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="font-medium text-base">{model.modelName}</span>
                        <span className="font-normal text-xs text-gray-500">
                          ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens/Month)
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {snap.modelError && (
                  <div className="text-red-500 text-sm mt-1" aria-live="polite">{snap.modelError}</div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Create Button */}
        <div className="pt-4 flex justify-end">
          {snap.isLoading ? (
            <Skeleton className="w-20 h-10" />
          ) : (
            <Link href="/" passHref>
              <Button
                onClick={handleCreateAgent}
                variant="gradient"
                disabled={!snap.selectedModel || !snap.agentName || agentSnap.saving}
                aria-label="Create Agent and go to home"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleCreateAgent(); }}
              >
                {agentSnap.saving ? <Loading size="sm" /> : "Create"}
              </Button>
            </Link>
          )}
          {agentSnap.error && (
            <div className="text-red-500 mt-2" role="alert">
              {agentSnap.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAgentContent; 