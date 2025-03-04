
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AIModel } from "@/components/dashboard/types";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepController } from "@/components/dashboard/StepController";
import { usePromptState } from "@/hooks/usePromptState";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";
import { useToast } from "@/hooks/use-toast";

// Define fallback models that match our database schema
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
  const [modelsInitialized, setModelsInitialized] = useState(false);
  const [isUpdatingModels, setIsUpdatingModels] = useState(false);
  const { toast } = useToast();
  
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

  // Check if we have models in the database and initialize them if needed
  useEffect(() => {
    const checkAndInitializeModels = async () => {
      if (modelsInitialized || isUpdatingModels) return;
      
      try {
        setIsUpdatingModels(true);
        toast({
          title: "Initializing AI Models",
          description: "Please wait while we load the available AI models...",
        });
        
        // First, check if we have any models
        const { data, error } = await supabase
          .from('ai_models')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error checking for models:', error);
          setIsUpdatingModels(false);
          toast({
            title: "Error Checking Models",
            description: "Could not verify if AI models exist. Will attempt to load them.",
            variant: "destructive"
          });
        }
        
        // If no models exist, try the edge function
        if (!data || data.length === 0) {
          console.log('No models found, triggering initial update via edge function');
          const result = await triggerInitialModelUpdate();
          console.log('Initial model update result:', result);
          
          // If the edge function failed, insert fallback models directly
          if (!result.success) {
            console.error('Failed to update models via edge function:', result.error);
            toast({
              title: "Edge Function Failed",
              description: "Could not load AI models from server. Using local fallback data.",
              variant: "destructive"
            });
            
            // Let's insert the fallback models directly into the database
            console.log('Inserting fallback models directly...');
            let insertedCount = 0;
            
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
                
              if (insertError) {
                console.error(`Error inserting model ${model.name}:`, insertError);
              } else {
                insertedCount++;
              }
            }
            
            console.log(`Inserted ${insertedCount} fallback models directly`);
            
            if (insertedCount > 0) {
              toast({
                title: "Fallback AI Models Loaded",
                description: `${insertedCount} AI models have been loaded successfully.`,
              });
            } else {
              toast({
                title: "Failed to Load Models",
                description: "Could not load AI models. Please try refreshing the page.",
                variant: "destructive"
              });
            }
          } else {
            toast({
              title: "AI Models Loaded",
              description: "AI models have been loaded successfully from the server.",
            });
          }
        } else {
          console.log('Models already exist, no need to initialize');
          toast({
            title: "AI Models Ready",
            description: "AI models are already available.",
          });
        }
        
        setModelsInitialized(true);
        setIsUpdatingModels(false);
      } catch (e) {
        console.error('Error in model initialization check:', e);
        setIsUpdatingModels(false);
        
        toast({
          title: "Model Initialization Error",
          description: "There was an error initializing AI models. Please try refreshing the page.",
          variant: "destructive"
        });
      }
    };
    
    // Run the check immediately when the component mounts
    checkAndInitializeModels();
  }, [modelsInitialized, isUpdatingModels, toast]);

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
            <StepController 
              user={user} 
              selectedModel={selectedModel} 
              setSelectedModel={setSelectedModel}
              isInitializingModels={isUpdatingModels}
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
        />

        <div className="absolute top-6 right-6 z-50">
          <SidebarTrigger className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
