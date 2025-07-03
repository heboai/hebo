"use client";

import { useState, useEffect } from 'react';
import { SupportedModel } from '@/types/models';
import { getSupportedModels } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Footer } from '@/components/auth/Footer';

export default function NewAgentPage() {
  const [models, setModels] = useState<SupportedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load models on component mount
    const loadModels = () => {
      try {
        const supportedModels = getSupportedModels();
        setModels(supportedModels);
        if (supportedModels.length > 0) {
          setSelectedModel(supportedModels[0].id);
        }
      } catch (error) {
        console.error('Failed to load supported models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleCreateAgent = () => {
    if (!selectedModel) {
      alert('Please select a model');
      return;
    }
    
    // TODO: Implement agent creation logic
    console.log('Creating agent with model:', selectedModel);
    // Redirect to root ("/") after agent creation
    window.location.href = "/";
  };

  if (isLoading) {
    return <Loading fullPage />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2">
          <img
            src="/hebo-icon.svg"
            alt="Hebo Logo"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold">Hebo</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full" style={{ maxHeight: 285, maxWidth: 512 }}>
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">
              Create a new agent
            </h1>
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
                <img
                  src="/square-arrow-out-up-right.svg"
                  alt="External link"
                  className="w-[16px] h-[16px] inline-block align-middle text-[#4F46E5]"
                  aria-hidden="true"
                />
              </a>
            </p>
          </div>

          <div className="space-y-6">

            {/* Agent Name */}
            <div className="flex items-center justify-between">
              <label 
                htmlFor="agent-name" 
                className="text-base font-semibold text-gray-700"
              >
                Agent Name
              </label>
              <input
                type="text"
                id="agent-name"
                placeholder="Name"
                className="w-80 h-[36px] px-3 py-2 border border-gray-300 rounded-[8px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
              />
            </div>
            {/* Model Selection */}
            <div className="flex items-center justify-between">
              <label 
                htmlFor="model-select" 
                className="text-base font-semibold text-gray-700"
              >
                Default Model
              </label>
              <div className="relative w-80">
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="w-full h-[36px] px-3 py-2 pr-10 border border-gray-300 rounded-[8px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white appearance-none"
                  aria-describedby="model-description"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      <span className="font-bold">{model.name}</span>{' '}
                      <span className="text-[12px] font-normal text-gray-500">
                        ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens/Month)
                      </span>
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center" aria-hidden="true">
                  <svg className="h-5 w-5 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            

            {/* Create Button */}
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleCreateAgent}
                className="bg-white border-2 border-transparent bg-gradient-to-br from-d1d5db to-4f46e5 bg-clip-border text-black font-bold py-2 px-4 rounded-[8px] relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                disabled={!selectedModel}
                style={{
                  background: 'linear-gradient(white, white) padding-box, linear-gradient(to top right, #d1d5db, #4f46e5) border-box',
                  border: '2px solid transparent'
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full p-4">
        <Footer />
      </footer>
    </div>
  );
} 