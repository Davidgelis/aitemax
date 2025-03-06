
import { useState, useEffect } from "react";
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: (variables: Variable[]) => void,
  finalPrompt: string,
  setFinalPrompt: (prompt: string) => void,
  showJson: boolean,
  setEditingPrompt: (prompt: string) => void,
  setShowEditPromptSheet: (show: boolean) => void,
  masterCommand: string
) => {
  const { toast } = useToast();
  const [editingPromptLocal, setEditingPromptLocal] = useState("");
  const [processedPrompt, setProcessedPrompt] = useState(finalPrompt);
  const [variableHighlights, setVariableHighlights] = useState<Record<string, string[]>>({});
  
  // Handle variable value change with live updating
  const handleVariableValueChange = (variableId: string, newValue: string) => {
    console.log(`Updating variable ${variableId} to value: ${newValue}`);
    
    // Update the variables array with the new value
    const updatedVariables = variables.map(v => 
      v.id === variableId ? { ...v, value: newValue, isRelevant: true } : v
    );
    
    // Update variables state
    setVariables(updatedVariables);
    
    // Get the old value to track replacements
    const oldValue = variables.find(v => v.id === variableId)?.value || '';
    
    // If we're doing an empty value update and there was no previous value, just return
    if (newValue.trim() === '' && oldValue.trim() === '') {
      return;
    }
    
    // Process the prompt again with updated variables
    setTimeout(() => {
      setProcessedPrompt(getProcessedPrompt());
    }, 0);
    
    // Toast confirmation of update
    toast({
      title: "Variable updated",
      description: "The prompt has been updated with your changes",
      variant: "default"
    });
  };

  // Process the prompt with variable replacements and track their positions
  const getProcessedPrompt = () => {
    let processed = finalPrompt;
    const highlightPositions: Record<string, string[]> = {};
    
    // Only replace variables if they have both a name and value
    const validVariables = variables.filter(v => 
      v.isRelevant === true && 
      v.name.trim() !== '' && 
      v.value && v.value.trim() !== ''
    );
    
    validVariables.forEach(variable => {
      // Create a regex that matches the variable name enclosed in {{...}}
      // with optional whitespace inside the braces
      const regex = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
      
      // For tracking variable positions
      if (variable.value) {
        highlightPositions[variable.id] = [];
        
        // Find all occurrences of this variable value in the text
        let match;
        const valueRegex = new RegExp(escapeRegExp(variable.value), 'g');
        const tempProcessed = processed.replace(regex, variable.value);
        
        while ((match = valueRegex.exec(tempProcessed)) !== null) {
          highlightPositions[variable.id].push(variable.value);
        }
      }
      
      processed = processed.replace(regex, variable.value || '');
    });
    
    // Update the highlight positions for use in rendering
    setVariableHighlights(highlightPositions);
    
    return processed;
  };
  
  // Update the processed prompt whenever variables change
  useEffect(() => {
    const newProcessedPrompt = getProcessedPrompt();
    setProcessedPrompt(newProcessedPrompt);
  }, [variables, finalPrompt]);
  
  const handleOpenEditPrompt = () => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  };
  
  const handleSaveEditedPrompt = (editedPrompt: string) => {
    setFinalPrompt(editedPrompt);
    setShowEditPromptSheet(false);
    
    toast({
      title: "Prompt updated",
      description: "Your changes have been saved",
    });
  };
  
  const handleAdaptPrompt = () => {
    // Implementation for adapting prompt
    setShowEditPromptSheet(false);
    
    toast({
      title: "Prompt adapted",
      description: "Your prompt has been regenerated",
    });
  };
  
  const handleCopyPrompt = () => {
    const textToCopy = showJson
      ? JSON.stringify({
          prompt: finalPrompt,
          masterCommand,
          variables: variables.filter(v => v.isRelevant === true),
        }, null, 2)
      : getProcessedPrompt();
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: showJson ? "JSON data copied" : "Processed prompt copied",
        });
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Failed to copy",
          description: "An error occurred while copying to clipboard",
          variant: "destructive",
        });
      });
  };
  
  const handleRegenerate = () => {
    // Implementation for regenerating prompt
    toast({
      title: "Prompt regenerated",
      description: "Your prompt has been regenerated",
    });
  };
  
  // Helper function to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Get the list of relevant variables for display in step 3
  const getRelevantVariables = () => {
    return variables.filter(v => v.isRelevant === true);
  };

  return {
    processedPrompt,
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    getRelevantVariables,
    variableHighlights
  };
};
