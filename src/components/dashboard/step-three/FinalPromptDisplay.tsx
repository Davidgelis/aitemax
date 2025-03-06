
import { Edit } from "lucide-react";
import { Variable, PromptJsonStructure } from "../types";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinalPromptDisplayProps {
  finalPrompt: string;
  getProcessedPrompt: () => string;
  variables: Variable[];
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
}

export const FinalPromptDisplay = ({
  finalPrompt,
  getProcessedPrompt,
  variables,
  showJson,
  masterCommand,
  handleOpenEditPrompt
}: FinalPromptDisplayProps) => {
  const [processedPrompt, setProcessedPrompt] = useState("");
  const [promptJson, setPromptJson] = useState<PromptJsonStructure | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const { toast } = useToast();
  
  // Ensure variables is a valid array before filtering
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  // Convert the prompt to JSON structure using GPT
  const convertPromptToJson = useCallback(async () => {
    if (!finalPrompt || finalPrompt.trim() === "") return;
    
    setIsLoadingJson(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-to-json', {
        body: {
          prompt: finalPrompt,
          masterCommand
        }
      });
      
      if (error) {
        throw new Error(`Error calling prompt-to-json: ${error.message}`);
      }
      
      if (data && data.jsonStructure) {
        setPromptJson(data.jsonStructure);
        console.log("Prompt JSON structure:", data.jsonStructure);
      }
    } catch (error) {
      console.error("Error converting prompt to JSON:", error);
      toast({
        title: "Error generating JSON",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingJson(false);
    }
  }, [finalPrompt, masterCommand, toast]);
  
  // When the prompt changes, update the JSON structure
  useEffect(() => {
    if (showJson) {
      convertPromptToJson();
    }
  }, [showJson, convertPromptToJson]);
  
  useEffect(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        const result = getProcessedPrompt();
        setProcessedPrompt(result || "");
      }
    } catch (error) {
      console.error("Error processing prompt:", error);
      setProcessedPrompt(finalPrompt || "");
    }
  }, [getProcessedPrompt, finalPrompt, variables]);
  
  // Render the processed prompt with highlighted variables
  const renderProcessedPrompt = () => {
    if (showJson) {
      try {
        if (isLoadingJson) {
          return <div className="text-xs animate-pulse">Generating JSON structure...</div>;
        }
        
        if (promptJson) {
          return (
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(promptJson, null, 2)}
            </pre>
          );
        }
        
        // Fallback to simple JSON view
        return (
          <pre className="text-xs font-mono">
            {JSON.stringify({ 
              prompt: finalPrompt || "", 
              masterCommand: masterCommand || "",
              variables: relevantVariables || []
            }, null, 2)}
          </pre>
        );
      } catch (error) {
        console.error("Error rendering JSON:", error);
        return <pre className="text-xs font-mono">Error rendering JSON</pre>;
      }
    }

    // Create a processed version that shows variable values highlighted
    try {
      if (!processedPrompt) {
        return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
      }
      
      const paragraphs = processedPrompt.split('\n\n');
      
      return (
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => {
            if (!paragraph) return null;
            
            let content = paragraph;
            
            // Highlight all variable values in the content
            if (Array.isArray(relevantVariables)) {
              relevantVariables.forEach(variable => {
                if (variable && variable?.value && variable.value.trim() !== '') {
                  try {
                    const regex = new RegExp(`(${escapeRegExp(variable.value)})`, 'gi');
                    content = content.replace(regex, '<span class="variable-highlight">$1</span>');
                  } catch (error) {
                    console.error("Error highlighting variable:", variable.name, error);
                  }
                }
              });
            }
            
            return (
              <p key={index} dangerouslySetInnerHTML={{ __html: content }} />
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error rendering processed prompt:", error);
      return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
    }
  };

  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <button 
        onClick={(e) => {
          e.preventDefault();
          try {
            if (typeof handleOpenEditPrompt === 'function') {
              handleOpenEditPrompt();
            }
          } catch (error) {
            console.error("Error opening edit prompt:", error);
          }
        }}
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label="Edit prompt"
      >
        <Edit className="w-4 h-4 text-accent" />
      </button>
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className="relative h-full p-6 overflow-y-auto">
        <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
        <div className="whitespace-pre-wrap text-card-foreground">
          {renderProcessedPrompt()}
        </div>
      </div>
    </div>
  );
};
