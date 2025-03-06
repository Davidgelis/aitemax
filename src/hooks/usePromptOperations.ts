
import { useState } from "react";
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
  
  // Display-only functions for step 3
  // This doesn't modify the original variables state shared with step 2
  const handleVariableValueChange = (variableId: string, newValue: string) => {
    // For step 3, we show variable values but don't modify them
    // This function is kept for compatibility but should not modify the variables
    toast({
      title: "Variables are display-only",
      description: "Variable values can only be edited in Step 2. Go back to edit variables.",
      variant: "default"
    });
  };

  const getProcessedPrompt = () => {
    let processedPrompt = finalPrompt;
    
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
      processedPrompt = processedPrompt.replace(regex, variable.value || '');
    });
    
    return processedPrompt;
  };
  
  const handleOpenEditPrompt = () => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  };
  
  const handleSaveEditedPrompt = () => {
    setFinalPrompt(editingPrompt);
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

  return {
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate
  };
};
