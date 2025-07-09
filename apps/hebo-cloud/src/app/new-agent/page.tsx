"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SupportedModel } from '@/types/models';
import { getSupportedModels } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Footer } from '@/components/auth/Footer';
import { ErrorPopup } from '@/components/ui/error-popup';

export default function NewAgentPage() {
  const [models, setModels] = useState<SupportedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
        setError('Failed to load supported models. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

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
      <ErrorPopup error={error} onClose={() => setError('')} />
      
      {/* Header with Logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2">
          <Image
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
        <div className="max-w-2xl w-full max-h-[285px] max-w-[512px]">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">
              Create a new agent
            </h1>
            <p className="text-gray-600">
              Each agent has its own model configuration and API keys. Learn more about which model to choose based on{' '}
              <a
                href="https://docs.hebo.ai/hebo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4F46E5] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#4F46E5] rounded"
                aria-label="Learn more about which model to choose based on Use Case (opens in a new tab)"
                tabIndex={0}
              >
                Use Case
                <Image
                  src="/square-arrow-out-up-right.svg"
                  alt="External link"
                  width={16}
                  height={16}
                  className="inline-block align-middle text-[#4F46E5]"
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
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-[36px] px-3 py-2 border border-gray-300 rounded-[8px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white text-left flex items-center justify-between"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  {selectedModel ? (
                    <span className="flex-1 min-w-0">
                      <span className="font-bold">
                        {models.find(m => m.id === selectedModel)?.name}
                      </span>
                      {' '}
                      <span className="text-xs text-gray-500">
                        ({Math.floor((models.find(m => m.id === selectedModel)?.freeTokensPerMonth || 0) / 1000000)}M Free Tokens/Month)
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500 flex-1">Select a model</span>
                  )}
                  <svg className="h-5 w-5 text-black flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-[8px] shadow-lg max-h-60 overflow-auto">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-base"
                      >
                        <span className="font-bold">{model.name}</span>
                        {' '}
                        <span className="text-xs text-gray-500">
                          ({Math.floor(model.freeTokensPerMonth / 1000000)}M Free Tokens/Month)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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