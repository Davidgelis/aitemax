
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
  const [jsonGenerated, setJsonGenerated] = useState(false);
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    getUserId();
  }, []);
  
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  const convertPromptToJson = useCallback(async () => {
    if (!finalPrompt || finalPrompt.trim() === "" || jsonGenerated) return;
    
    setIsLoadingJson(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-to-json', {
        body: {
          prompt: finalPrompt,
          masterCommand,
          userId,
          promptId
        }
      });
      
      if (error) {
        throw new Error(`Error calling prompt-to-json: ${error.message}`);
      }
      
      if (data && data.jsonStructure) {
        setPromptJson(data.jsonStructure);
        setJsonGenerated(true);
        console.log("Prompt JSON structure generated:", data.jsonStructure);
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
  }, [finalPrompt, masterCommand, toast, userId, promptId, jsonGenerated]);
  
  useEffect(() => {
    if (showJson && !jsonGenerated && !isLoadingJson) {
      convertPromptToJson();
    }
  }, [showJson, finalPrompt, convertPromptToJson, jsonGenerated, isLoadingJson]);
  
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
  
  const escapeRegExp = (string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  const highlightVariablesInText = (text: string) => {
    if (!text || !Array.isArray(relevantVariables) || relevantVariables.length === 0) {
      return text;
    }
    
    let processedText = text;
    
    relevantVariables.forEach(variable => {
      if (!variable || !variable.name) return;
      
      try {
        // Highlight unresolved variables (those without values)
        if (!variable.value) {
          const pattern = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
          processedText = processedText.replace(pattern, 
            `<span class="unresolved-variable">{{${variable.name}}}</span>`);
        } 
        // Highlight resolved variables (those with values)
        else {
          const escapedValue = escapeRegExp(variable.value);
          const valuePattern = new RegExp(`\\b${escapedValue}\\b`, 'g');
          processedText = processedText.replace(valuePattern, 
            `<span class="variable-highlight">${variable.value}</span>`);
        }
      } catch (error) {
        console.error(`Error highlighting variable ${variable.name}:`, error);
      }
    });
    
    return processedText;
  };
  
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
        
        return (
          <pre className="text-xs font-mono">
            {JSON.stringify({ 
              prompt: finalPrompt || "", 
              masterCommand: masterCommand || ""
            }, null, 2)}
          </pre>
        );
      } catch (error) {
        console.error("Error rendering JSON:", error);
        return <pre className="text-xs font-mono">Error rendering JSON</pre>;
      }
    }

    try {
      if (!processedPrompt) {
        return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
      }
      
      const paragraphs = processedPrompt.split('\n\n');
      
      return (
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => {
            if (!paragraph) return null;
            
            const highlightedContent = highlightVariablesInText(paragraph);
            
            return (
              <p key={index} dangerouslySetInnerHTML={{ __html: highlightedContent }} />
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
      
      <style>
        {`
        .variable-highlight {
          background-color: rgba(51, 254, 166, 0.2);
          border-radius: 2px;
          padding: 0 2px;
          border-bottom: 1px solid rgba(51, 254, 166, 0.5);
        }
        .unresolved-variable {
          background-color: rgba(254, 51, 51, 0.1);
          border-radius: 2px;
          padding: 0 2px;
          border-bottom: 1px dashed rgba(254, 51, 51, 0.5);
        }
        `}
      </style>
    </div>
  );
};
