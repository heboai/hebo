'use client';
import React, { useRef, useEffect } from "react";
import { Skeleton } from "./Skeleton";
import { Button } from "./button";
import { proxy, useSnapshot } from 'valtio';
import { SquareArrowOutUpRight } from "lucide-react";
import { agentStore } from "@/store/agentStore";
import { createAgent } from "@/services/createAgent";
import { Loading } from "./loading";
import Link from "next/link";

export type NewAgentContentProps = {
  models: { modelName: string; freeTokensPerMonth: number }[];
};

const state = proxy({
  isLoading: false,
  selectedModel: '',
  agentName: '',
  isDropdownOpen: false,
});

const NewAgentContent: React.FC<NewAgentContentProps> = ({ models }) => {
  const snap = useSnapshot(state);
  const agentSnap = useSnapshot(agentStore);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Remove useRouter import and usage

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        state.isDropdownOpen = false;
      }
    }
    if (snap.isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [snap.isDropdownOpen]);

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      state.isDropdownOpen = true;
    }
    if (e.key === "Escape") {
      state.isDropdownOpen = false;
    }
  };

  const handleCreateAgent = async () => {
    if (!snap.selectedModel) {
      alert('Please select a model');
      return;
    }
    if (!snap.agentName) {
      alert('Please enter an agent name');
      return;
    }
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
            className="inline-flex items-center gap-1 text-[#4F46E5] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#4F46E5] rounded"
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
            <Skeleton width={320} height={36} />
          ) : (
            <input
              type="text"
              id="agent-name"
              placeholder="Name"
              value={snap.agentName}
              onChange={e => (state.agentName = e.target.value)}
              className="w-80 h-[36px] px-3 py-2 border border-gray-300 rounded-[8px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
              aria-label="Agent Name"
              disabled={agentSnap.saving}
            />
          )}
        </div>
        {/* Model Selection */}
        <div className="flex items-center justify-between">
          <label htmlFor="model-select" className="text-base font-semibold text-gray-700">
            Default Model
          </label>
          <div className="relative w-80" ref={dropdownRef}>
            {snap.isLoading ? (
              <Skeleton width={320} height={36} />
            ) : (
              <>
                <button
                  type="button"
                  id="model-select"
                  onClick={() => (state.isDropdownOpen = !snap.isDropdownOpen)}
                  onKeyDown={handleDropdownKeyDown}
                  className="w-full h-[36px] px-3 py-2 border border-gray-300 rounded-[8px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white text-left flex items-center justify-between"
                  aria-haspopup="listbox"
                  aria-expanded={snap.isDropdownOpen}
                  aria-controls="model-listbox"
                >
                  {snap.selectedModel ? (
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-base">
                        {models.find((m) => m.modelName === snap.selectedModel)?.modelName}
                      </span>{' '}
                      <span className="font-normal text-xs text-gray-500">
                        ({Math.floor((models.find((m) => m.modelName === snap.selectedModel)?.freeTokensPerMonth || 0) / 1000000)}M Free Tokens/Month)
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500 flex-1">Select a model</span>
                  )}
                  <svg className="h-5 w-5 text-black flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {snap.isDropdownOpen && (
                  <div
                    id="model-listbox"
                    role="listbox"
                    tabIndex={-1}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-[8px] shadow-lg max-h-60 overflow-auto"
                  >
                    {models.map((model) => (
                      <button
                        key={model.modelName}
                        type="button"
                        role="option"
                        aria-selected={snap.selectedModel === model.modelName}
                        onClick={() => {
                          state.selectedModel = model.modelName;
                          state.isDropdownOpen = false;
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-base flex items-center ${snap.selectedModel === model.modelName ? 'bg-gray-100' : ''}`}
                      >
                        <span className="font-medium text-base">{model.modelName}</span>{' '}
                        <span className="font-normal text-xs text-gray-500 ml-1">
                          ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens/Month)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Create Button */}
        <div className="pt-4 flex justify-end">
          {snap.isLoading ? (
            <Skeleton width={100} height={40} />
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

export default NewAgentContent; 