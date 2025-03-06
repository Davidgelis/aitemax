import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AIModel } from "@/components/dashboard/types";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepController } from "@/components/dashboard/StepController";
import { usePromptState } from "@/hooks/usePromptState";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";
import { useToast } from "@/hooks/use-toast";

const fallbackModels = [
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model combining vision and language capabilities.",
    strengths: ["Multimodal capabilities", "State-of-the-art performance", "Handles complex reasoning", "Faster processing than GPT-4"],
    limitations: ["May produce convincing but incorrect information", "Limited knowledge cutoff", "Not specialized for specific domains"]
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's most capable model with excellent performance across reasoning, math, and coding tasks.",
    strengths: ["Strong reasoning abilities", "Code generation", "Less tendency to hallucinate", "Good at following instructions"],
    limitations: ["Higher latency than smaller models", "Less widely available than some competitors", "Limited context window"]
  },
  {
    name: "Llama 3",
    provider: "Meta",
    description: "Meta's latest open-source large language model with improved reasoning and instruction following.",
    strengths: ["Open-source architecture", "Strong performance for its size", "Active community development", "Multiple size variants"],
    limitations: ["Smaller context window than some competitors", "Less training data than closed models", "May require more explicit prompting"]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A smaller, faster, and more cost-effective version of GPT-4o.",
    strengths: ["Faster response time", "Lower cost", "Good balance of performance and efficiency", "Multimodal capabilities"],
    limitations: ["Less capable than full GPT-4o on complex tasks", "Reduced reasoning ability compared to larger models", "Limited context window"]
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model with extended context window and improved reasoning.",
    strengths: ["Very large context window", "Strong multimodal understanding", "Good reasoning capabilities", "Efficient processing"],
    limitations: ["May struggle with certain specialized domains", "Potential for generating incorrect information", "Less tested than some alternatives"]
  }
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedCognitive, setSelectedCognitive] = useState<string | null>(null);
  const [modelsInitialized, setModelsInitialized] = useState(false);
  const [isUpdatingModels, setIsUpdatingModels] = useState(false);
  const { toast } = useToast();
  
  const promptState = usePromptState(user);
  
  const filteredPrompts = promptState.savedPrompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(promptState.searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    const forceUpdateModels = async () => {
      try {
        setIsUpdatingModels(true);
        
        const result = await triggerInitialModelUpdate();
        
        if (!result.success) {
          console.log("Failed to update AI models. Using fallback data.");
          insertFallbackModelsDirectly();
        }
        
        setModelsInitialized(true);
        setIsUpdatingModels(false);
      } catch (error) {
        console.error("Error updating models:", error);
        insertFallbackModelsDirectly();
        
        setModelsInitialized(true);
        setIsUpdatingModels(false);
      }
    };
    
    forceUpdateModels();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleCognitiveToggle = (id: string) => {
    setSelectedCognitive(currentSelected => currentSelected === id ? null : id);
    
    if (selectedCognitive === null) {
      toast({
        title: "Cognitive Model Activated",
        description: "Your prompts will now undergo an additional precision-driven refinement",
      });
    }
  };

  const insertFallbackModelsDirectly = async () => {
    console.log('Inserting fallback models directly...');
    let insertedCount = 0;
    
    const { data: existingModels } = await supabase
      .from('ai_models')
      .select('id')
      .limit(1);
      
    if (existingModels && existingModels.length > 0) {
      console.log('Models already exist, skipping direct insertion');
      return;
    }
    
    for (const model of fallbackModels) {
      const { error: insertError } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        });
        
      if (!insertError) {
        insertedCount++;
      } else {
        console.error('Error inserting model:', model.name, insertError);
      }
    }
    
    console.log(`Inserted ${insertedCount} fallback models directly`);
  };

  useEffect(() => {
    if (user) {
      promptState.fetchSavedPrompts();
    }
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
            <StepController 
              user={user} 
              selectedModel={selectedModel} 
              setSelectedModel={setSelectedModel}
              isInitializingModels={isUpdatingModels}
              selectedCognitive={selectedCognitive}
              handleCognitiveToggle={handleCognitiveToggle}
              promptState={promptState}
            />
          </div>
        </main>

        <UserSidebar 
          user={user}
          savedPrompts={promptState.savedPrompts}
          filteredPrompts={filteredPrompts}
          searchTerm={promptState.searchTerm}
          setSearchTerm={promptState.setSearchTerm}
          isLoadingPrompts={promptState.isLoadingPrompts}
          handleNewPrompt={promptState.handleNewPrompt}
          handleDeletePrompt={promptState.handleDeletePrompt}
          handleDuplicatePrompt={promptState.handleDuplicatePrompt}
          handleRenamePrompt={promptState.handleRenamePrompt}
          loadSavedPrompt={promptState.loadSavedPrompt}
          drafts={promptState.drafts}
          isLoadingDrafts={promptState.isLoadingDrafts}
          loadDraft={promptState.loadSelectedDraft}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
