
import { Edit } from "lucide-react";
import { Variable } from "../types";
import { useEffect, useState } from "react";

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
  const relevantVariables = variables?.filter(v => v?.isRelevant === true) || [];
  
  useEffect(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        setProcessedPrompt(getProcessedPrompt());
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
      const paragraphs = (processedPrompt || "").split('\n\n');
      
      return (
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => {
            if (!paragraph) return null;
            
            let content = paragraph;
            
            // Highlight all variable values in the content
            relevantVariables.forEach(variable => {
              if (variable?.value && variable.value.trim() !== '') {
                try {
                  const regex = new RegExp(`(${escapeRegExp(variable.value)})`, 'gi');
                  content = content.replace(regex, '<span class="variable-highlight">$1</span>');
                } catch (error) {
                  console.error("Error highlighting variable:", variable.name, error);
                }
              }
            });
            
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
        onClick={() => {
          try {
            if (typeof handleOpenEditPrompt === 'function') {
              handleOpenEditPrompt();
            }
          } catch (error) {
            console.error("Error opening edit prompt:", error);
          }
        }}
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
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
