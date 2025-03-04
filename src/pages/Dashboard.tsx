
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AIModel } from "@/components/dashboard/types";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepController } from "@/components/dashboard/StepController";
import { usePromptState } from "@/hooks/usePromptState";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [modelsInitialized, setModelsInitialized] = useState(false);
  
  // Use the prompt state hook to get the state and functions
  const promptState = usePromptState(user);
  
  // Compute filtered prompts based on search term
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

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check if we have models in the database
  useEffect(() => {
    const checkAndInitializeModels = async () => {
      if (modelsInitialized) return;
      
      try {
        // First, check if we have any models
        const { data, error } = await supabase
          .from('ai_models')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error checking for models:', error);
          return;
        }
        
        // If no models exist, trigger the update once
        if (!data || data.length === 0) {
          console.log('No models found, triggering initial update');
          await triggerInitialModelUpdate();
        } else {
          console.log('Models already exist, no need to initialize');
        }
        
        setModelsInitialized(true);
      } catch (e) {
        console.error('Error in model initialization check:', e);
      }
    };
    
    checkAndInitializeModels();
  }, [modelsInitialized]);

  // Fetch saved prompts when user changes
  useEffect(() => {
    if (user) {
      promptState.fetchSavedPrompts();
    }
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex items-center justify-center">
            <StepController user={user} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
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
        />

        <div className="absolute top-6 right-6 z-50">
          <SidebarTrigger className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
