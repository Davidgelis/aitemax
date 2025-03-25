
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AIModel, UploadedImage } from "@/components/dashboard/types";
import { ModelSelector } from "@/components/dashboard/ModelSelector";
import { useToast } from "@/hooks/use-toast";
import { PrimaryToggleBar } from "@/components/dashboard/PrimaryToggleBar";
import { SecondaryToggleBar } from "@/components/dashboard/SecondaryToggleBar";
import { WebsiteScanner } from "@/components/dashboard/WebsiteScanner";
import { usePromptTemplates } from "@/hooks/usePromptTemplates";
import { supabase } from "@/integrations/supabase/client";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the props for the component
interface StepOneContentProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
  onImagesChange: (images: UploadedImage[]) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
  onSmartContext: (context: string, usageInstructions: string) => void;
  selectedTemplateId?: string | null;
}

export const StepOneContent = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading,
  selectedModel,
  setSelectedModel,
  selectedCognitive,
  handleCognitiveToggle,
  onImagesChange,
  onWebsiteScan,
  onSmartContext,
  selectedTemplateId
}: StepOneContentProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [templateInfo, setTemplateInfo] = useState<{name: string, isDefault: boolean} | null>(null);
  
  // Get the user for the prompt templates hook
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    getUser();
  }, []);

  // Fetch template info if a template ID is provided
  useEffect(() => {
    const fetchTemplateInfo = async () => {
      if (selectedTemplateId) {
        try {
          const { data, error } = await supabase
            .from('prompt_templates')
            .select('title, is_default')
            .eq('id', selectedTemplateId)
            .single();
            
          if (error) {
            console.error("Error fetching template info:", error);
            return;
          }
          
          if (data) {
            setTemplateInfo({
              name: data.title,
              isDefault: data.is_default
            });
          }
        } catch (error) {
          console.error("Error in template info fetch:", error);
        }
      } else {
        setTemplateInfo(null);
      }
    };
    
    fetchTemplateInfo();
  }, [selectedTemplateId]);
  
  // Handle the form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    
    onAnalyze();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm sticky top-0 z-20 pb-3">
          <div>
            {/* Selected Template Info */}
            {templateInfo && (
              <div className="flex items-center">
                <div className="text-sm text-muted-foreground flex items-center">
                  <span>Template:</span>
                  <span className="font-medium text-foreground ml-1">{templateInfo.name}</span>
                  {templateInfo.isDefault && (
                    <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">Default</span>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          This template will be used to structure your enhanced prompt. 
                          You can change it in the Templates tab of the X Panel.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold bg-aurora-gradient bg-aurora animate-aurora bg-clip-text text-transparent" style={{ backgroundSize: "400% 400%" }}>
              Enter Your Prompt
            </h2>
          </div>
          
          <Button type="submit" className="aurora-button" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
        
        {/* Prompt Input */}
        <div className="flex-grow my-4">
          <textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            className="w-full h-64 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#64bf95] shadow-inner resize-none"
            placeholder="Enter your prompt here..."
            disabled={isLoading}
          />
        </div>
        
        {/* Primary Toggle Bar */}
        <PrimaryToggleBar 
          selectedPrimary={selectedPrimary} 
          handlePrimaryToggle={handlePrimaryToggle} 
        />
        
        {/* Secondary Toggle Bar */}
        <SecondaryToggleBar 
          selectedSecondary={selectedSecondary} 
          handleSecondaryToggle={handleSecondaryToggle} 
        />
        
        {/* Website Scanner */}
        <WebsiteScanner onScan={onWebsiteScan} />
        
        {/* AI Model Selector */}
        <ModelSelector 
          selectedModel={selectedModel} 
          setSelectedModel={setSelectedModel}
        />
        
        {/* Submission Button */}
        <Button 
          type="submit" 
          className="aurora-button w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? "Analyzing..." : "Analyze Prompt"}
        </Button>
      </div>
    </form>
  );
};
