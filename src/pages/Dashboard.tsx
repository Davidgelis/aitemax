import React from 'react';
import { ModelSelector } from '@/components/dashboard/model-selector';
import { PromptEditor } from '@/components/dashboard/prompt-editor';
import { PromptOutput } from '@/components/dashboard/prompt-output';
import { useDashboard } from '@/hooks/use-dashboard';
import { ModelProvider } from '@/context/ModelContext';
import { SettingsSidebar } from '@/components/dashboard/settings-sidebar';
import { XTemplatesList } from '@/components/x-templates/XTemplatesList';
import { Separator } from "@/components/ui/separator"
import { ModelRefreshButton } from '@/components/dashboard/ModelRefreshButton';
import { OpenAIModelsViewer } from "@/components/dashboard/OpenAIModelsViewer";

const Dashboard = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    prompt, 
    setPrompt, 
    output, 
    isInitializingModels,
    isGeneratingOutput,
    handleGenerateOutput
  } = useDashboard();

  return (
    <div className="flex-1">
      <div className="container mx-auto p-4 space-y-4">
        <OpenAIModelsViewer />
        <ModelProvider>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <ModelRefreshButton />
          </div>
          <ModelSelector 
            onSelect={setSelectedModel} 
            isInitializingModels={isInitializingModels}
            selectedModel={selectedModel}
          />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3 space-y-4">
              <PromptEditor prompt={prompt} setPrompt={setPrompt} onSubmit={handleGenerateOutput} isGenerating={isGeneratingOutput} />
              <PromptOutput output={output} />
            </div>
            <div className="md:col-span-2">
              <SettingsSidebar />
              <Separator className="my-4" />
              <XTemplatesList />
            </div>
          </div>
        </ModelProvider>
      </div>
    </div>
  );
};

export default Dashboard;
