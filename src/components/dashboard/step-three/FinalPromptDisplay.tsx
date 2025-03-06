
import { Edit } from "lucide-react";
import { Variable } from "../types";
import { useEffect, useState, useCallback, useRef } from "react";
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

interface PromptSection {
  type: string;
  content: string;
  variables: {name: string, value: string}[];
}

interface PromptJsonStructure {
  title: string;
  sections: PromptSection[];
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
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});
  const [jsonStructure, setJsonStructure] = useState<PromptJsonStructure | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const previousPromptRef = useRef<string>("");
  const { toast } = useToast();
  
  // Ensure variables is a valid array before filtering
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  // Helper function to escape special characters in regex
  const escapeRegExp = useCallback((string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);
  
  // Convert the prompt to JSON structure when it changes
  useEffect(() => {
    const convertPromptToJson = async () => {
      // Skip if final prompt is empty or hasn't changed
      if (!finalPrompt || finalPrompt === previousPromptRef.current) {
        return;
      }
      
      previousPromptRef.current = finalPrompt;
      setIsLoadingJson(true);
      setJsonError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('prompt-to-json', {
          body: { promptText: finalPrompt }
        });
        
        if (error) {
          console.error("Error converting prompt to JSON:", error);
          setJsonError("Failed to parse prompt structure");
          setJsonStructure(null);
        } else if (data?.jsonStructure) {
          console.log("Received JSON structure:", data.jsonStructure);
          setJsonStructure(data.jsonStructure);
        } else if (data?.error) {
          console.error("Edge function error:", data.error);
          setJsonError(data.error);
          setJsonStructure(null);
        }
      } catch (error) {
        console.error("Exception during prompt-to-json call:", error);
        setJsonError("Failed to process prompt structure");
        setJsonStructure(null);
      } finally {
        setIsLoadingJson(false);
      }
    };
    
    convertPromptToJson();
  }, [finalPrompt]);
  
  // Update processed prompt when inputs change
  useEffect(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        const result = getProcessedPrompt();
        setProcessedPrompt(result || "");
        
        // Create highlighted variables mapping
        const highlighted: Record<string, boolean> = {};
        if (Array.isArray(relevantVariables)) {
          relevantVariables.forEach(variable => {
            if (variable && variable.value && variable.value.trim() !== '') {
              highlighted[variable.value] = true;
            }
          });
        }
        setHighlightedVariables(highlighted);
      }
    } catch (error) {
      console.error("Error processing prompt:", error);
      setProcessedPrompt(finalPrompt || "");
    }
  }, [getProcessedPrompt, finalPrompt, variables, relevantVariables]);
  
  // Render JSON view of the prompt structure
  const renderJsonView = () => {
    if (isLoadingJson) {
      return <div className="text-center py-4">Parsing prompt structure...</div>;
    }
    
    if (jsonError) {
      return <div className="text-center py-4 text-red-500">Error: {jsonError}</div>;
    }
    
    if (jsonStructure) {
      return (
        <pre className="text-xs font-mono overflow-auto max-h-[400px]">
          {JSON.stringify(jsonStructure, null, 2)}
        </pre>
      );
    }
    
    if (showJson) {
      try {
        return (
          <pre className="text-xs font-mono overflow-auto max-h-[400px]">
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
    
    return null;
  };
  
  // Render the processed prompt with highlighted variables
  const renderProcessedPrompt = () => {
    if (showJson) {
      return renderJsonView();
    }

    // Create a processed version that shows variable values highlighted
    try {
      if (!processedPrompt) {
        return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
      }
      
      // Split into paragraphs for better display
      const paragraphs = processedPrompt.split('\n\n');
      
      return (
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => {
            if (!paragraph) return <p key={index}></p>;
            
            let content = paragraph;
            
            // Highlight all variable values in the content
            if (Array.isArray(relevantVariables)) {
              relevantVariables.forEach(variable => {
                if (variable && variable.value && variable.value.trim() !== '') {
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
