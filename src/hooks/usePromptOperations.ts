import { useState, useCallback } from "react";
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: (vars: Variable[] | ((current: Variable[]) => Variable[])) => void,
  finalPrompt: string,
  setFinalPrompt: (prompt: string) => void,
  showJson: boolean,
  setEditingPrompt: (prompt: string) => void,
  setShowEditPromptSheet: (show: boolean) => void,
  masterCommand: string
) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Process the prompt to replace variables with their values
  const getProcessedPrompt = useCallback(() => {
    try {
      if (!finalPrompt) return "";
      
      // Ensure variables is a valid array
      if (!Array.isArray(variables)) {
        console.error("Invalid variables array in getProcessedPrompt:", variables);
        return finalPrompt;
      }
      
      // Filter to only the relevant variables with values
      const relevantVariables = variables.filter(
        v => v && v.isRelevant === true && v.name && v.value
      );
      
      if (relevantVariables.length === 0) {
        return finalPrompt; // No variables to replace
      }
      
      let processedPrompt = finalPrompt;
      
      // Replace each {{variable}} with its value
      relevantVariables.forEach(variable => {
        if (!variable.name || !variable.value) return;
        
        const variablePattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        processedPrompt = processedPrompt.replace(variablePattern, variable.value);
      });
      
      return processedPrompt;
    } catch (error) {
      console.error("Error in getProcessedPrompt:", error);
      return finalPrompt;
    }
  }, [finalPrompt, variables]);

  // Extract variables from the prompt text
  const extractVariablesFromPrompt = useCallback((promptText: string) => {
    if (!promptText) return [];
    
    try {
      const regex = /{{([^{}]+)}}/g;
      const matches = [...promptText.matchAll(regex)];
      
      const extractedVars: Record<string, string> = {};
      
      matches.forEach(match => {
        const name = match[1].trim();
        if (name) {
          extractedVars[name] = name;
        }
      });
      
      return Object.keys(extractedVars);
    } catch (error) {
      console.error("Error extracting variables:", error);
      return [];
    }
  }, []);

  // Update a variable's value
  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    try {
      // Use the function form of setVariables to properly update the state
      setVariables((currentVars: Variable[]) => {
        // Ensure current is a valid array
        if (!Array.isArray(currentVars)) {
          console.error("Invalid variables array in handleVariableValueChange:", currentVars);
          return [];
        }
        
        return currentVars.map(v => {
          if (v.id === variableId) {
            return { ...v, value: newValue };
          }
          return v;
        });
      });
    } catch (error) {
      console.error("Error in handleVariableValueChange:", error);
    }
  }, [setVariables]);

  // Open the edit prompt sheet
  const handleOpenEditPrompt = useCallback(() => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  }, [finalPrompt, setEditingPrompt, setShowEditPromptSheet]);

  // Save the edited prompt and update variables
  const handleSaveEditedPrompt = useCallback((editedPrompt: string) => {
    // Update the final prompt with the edited text
    setFinalPrompt(editedPrompt);
    
    // Extract variables from the edited prompt
    const promptVariableNames = extractVariablesFromPrompt(editedPrompt);
    
    // Update the variables array
    setVariables((currentVars: Variable[]) => {
      // Ensure current is a valid array
      if (!Array.isArray(currentVars)) {
        console.error("Invalid variables array in handleSaveEditedPrompt:", currentVars);
        return [];
      }
      
      // Keep existing variables that are still in the prompt
      const existingVars = currentVars.filter(v => 
        promptVariableNames.includes(v.name)
      );
      
      // Create new variables for any new variable names found
      const newVars = promptVariableNames
        .filter(name => !currentVars.some(v => v.name === name))
        .map((name, index) => ({
          id: `v-new-${Date.now()}-${index}`,
          name,
          value: "",
          isRelevant: true,
          category: "Custom"
        }));
      
      // Mark all variables as relevant since they exist in the prompt
      const updatedVars = existingVars.map(v => ({
        ...v,
        isRelevant: true
      }));
      
      // Combine existing and new variables
      return [...updatedVars, ...newVars];
    });
    
    // Close the edit sheet
    setShowEditPromptSheet(false);
    
    toast({
      title: "Prompt updated",
      description: "Your prompt has been updated with new variables.",
    });
  }, [setFinalPrompt, extractVariablesFromPrompt, setVariables, setShowEditPromptSheet, toast]);

  // Adapt the prompt (future API integration)
  const handleAdaptPrompt = useCallback(() => {
    // This is where we would call an API to adapt the prompt
    // For now, we're just handling the simple case
    handleSaveEditedPrompt(editingPrompt);
    
    toast({
      title: "Prompt adapted",
      description: "Your prompt has been adapted and saved.",
    });
  }, [handleSaveEditedPrompt, editingPrompt, toast]);

  // Copy the processed prompt to clipboard
  const handleCopyPrompt = useCallback(() => {
    try {
      const textToCopy = getProcessedPrompt();
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Your processed prompt has been copied to the clipboard.",
        });
        
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  }, [getProcessedPrompt, toast]);

  // Regenerate the final prompt from all inputs
  const handleRegenerate = useCallback(() => {
    // This would be where we call an API to regenerate
    // For now we'll just show a toast
    toast({
      title: "Regenerating prompt",
      description: "This feature will regenerate your prompt with the current inputs.",
    });
  }, [toast]);

  return {
    getProcessedPrompt,
    extractVariablesFromPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    isCopied
  };
};
