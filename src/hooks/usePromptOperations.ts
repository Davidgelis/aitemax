
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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
  const [processedPrompt, setProcessedPrompt] = useState(finalPrompt);

  // Process the prompt to replace variables and highlight them
  const getProcessedPrompt = () => {
    let processed = finalPrompt;
    
    // First look for variable names in the prompt
    variables.forEach(variable => {
      if (variable.isRelevant && variable.name) {
        // Use both versions of the variable format
        const placeholder1 = `{{${variable.name}}}`;
        const placeholder2 = variable.name;
        
        const highlightedValue = `<span class="bg-[#33fea6]/20 px-1 rounded border border-[#33fea6]/30">${variable.value || placeholder2}</span>`;
        
        // Replace {{variableName}} format first
        processed = processed.replace(
          new RegExp(placeholder1, 'g'), 
          showJson ? variable.value || placeholder2 : highlightedValue
        );
        
        // Look for exact variable name matches, but be careful not to replace partial matches
        const safeVariableName = placeholder2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactMatchRegex = new RegExp(`\\b${safeVariableName}\\b`, 'g');
        
        processed = processed.replace(
          exactMatchRegex, 
          showJson ? variable.value || placeholder2 : highlightedValue
        );
      }
    });
    
    return processed;
  };

  const handleVariableValueChange = (variableId: string, newValue: string) => {
    // Update the variable
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, value: newValue } : v
    ));
    
    // Immediately update the final prompt with the new variable value
    updateFinalPromptWithVariables(variableId, newValue);
  };
  
  // Function to update final prompt when a variable value changes
  const updateFinalPromptWithVariables = (changedVariableId: string, newValue: string) => {
    const changedVariable = variables.find(v => v.id === changedVariableId);
    
    if (!changedVariable || !changedVariable.name) return;
    
    // Create a copy of the current finalPrompt to work with
    let updatedPrompt = finalPrompt;
    
    // Replace both formats of variable placeholders in the prompt
    const placeholder1 = `{{${changedVariable.name}}}`;
    const safeVariableName = changedVariable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactMatchRegex = new RegExp(`\\b${safeVariableName}\\b`, 'g');
    
    // Replace {{variableName}} format
    updatedPrompt = updatedPrompt.replace(
      new RegExp(placeholder1, 'g'),
      newValue || changedVariable.name
    );
    
    // Replace plain variableName format (only exact matches)
    updatedPrompt = updatedPrompt.replace(
      exactMatchRegex,
      newValue || changedVariable.name
    );
    
    // Update the finalPrompt if changes were made
    if (updatedPrompt !== finalPrompt) {
      setFinalPrompt(updatedPrompt);
    }
  };

  // This effect is no longer needed as we're updating the prompt directly
  // when variable values change in handleVariableValueChange
  
  const handleOpenEditPrompt = () => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  };

  const handleSaveEditedPrompt = () => {
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt updated successfully",
    });
  };

  const handleAdaptPrompt = () => {
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt adapted successfully",
    });
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(showJson ? JSON.stringify({ 
        prompt: finalPrompt, 
        masterCommand,
        variables: variables.filter(v => v.isRelevant === true)
      }, null, 2) : finalPrompt);
      
      toast({
        title: "Success",
        description: "Prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    toast({
      title: "Success",
      description: "Prompt regenerated successfully",
    });
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
