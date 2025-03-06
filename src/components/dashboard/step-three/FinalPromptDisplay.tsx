
import { Edit } from "lucide-react";
import { Variable } from "../types";
import { useEffect, useState, useCallback } from "react";

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
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});
  
  // Ensure variables is a valid array before filtering
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  // Helper function to escape special characters in regex
  const escapeRegExp = useCallback((string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);
  
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
  
  // Render the processed prompt with highlighted variables
  const renderProcessedPrompt = () => {
    if (showJson) {
      try {
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
