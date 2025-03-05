
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

  // This effect syncs the variables with the finalPrompt
  useEffect(() => {
    const relevantVariables = variables.filter(v => v.isRelevant);
    if (relevantVariables.length > 0 && finalPrompt) {
      // Only update the finalPrompt when not in JSON view mode
      if (!showJson) {
        let updatedPrompt = finalPrompt;
        
        relevantVariables.forEach(variable => {
          if (variable.name && variable.value !== undefined) {
            // Replace {{variableName}} format
            const placeholder1 = `{{${variable.name}}}`;
            updatedPrompt = updatedPrompt.replace(
              new RegExp(placeholder1, 'g'), 
              variable.value || variable.name
            );
            
            // Replace exact variable name matches
            const safeVariableName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const exactMatchRegex = new RegExp(`\\b${safeVariableName}\\b`, 'g');
            updatedPrompt = updatedPrompt.replace(
              exactMatchRegex, 
              variable.value || variable.name
            );
          }
        });
        
        // Only update if the prompt has actually changed
        if (updatedPrompt !== finalPrompt) {
          setFinalPrompt(updatedPrompt);
        }
      }
    }
  }, [variables, showJson]);

  const handleVariableValueChange = (variableId: string, newValue: string) => {
    // Update the variable
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, value: newValue } : v
    ));
  };

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
