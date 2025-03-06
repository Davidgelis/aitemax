import { useState, useCallback } from "react";
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { extractVariablesFromPrompt, replaceVariableInPrompt } from "@/utils/promptUtils";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: (vars: Variable[] | ((current: Variable[]) => Variable[])) => void,
  finalPrompt: string,
  setFinalPrompt: (prompt: string) => void,
  showJson: boolean,
  setEditingPrompt: (prompt: string) => void,
  setShowEditPromptSheet: (show: boolean) => void,
  masterCommand: string,
  editingPrompt: string
) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const getProcessedPrompt = useCallback(() => {
    try {
      if (!finalPrompt) return "";
      
      if (!Array.isArray(variables)) {
        console.error("Invalid variables array in getProcessedPrompt:", variables);
        return finalPrompt;
      }
      
      const relevantVariables = variables.filter(
        v => v && v.isRelevant === true
      );
      
      if (relevantVariables.length === 0) {
        return finalPrompt;
      }
      
      let processedPrompt = finalPrompt;
      
      relevantVariables.forEach(variable => {
        if (!variable.name) return;
        
        // If the variable has a value, replace the placeholder with the value
        if (variable.value) {
          const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
          processedPrompt = processedPrompt.replace(pattern, variable.value);
        }
      });
      
      return processedPrompt;
    } catch (error) {
      console.error("Error in getProcessedPrompt:", error);
      return finalPrompt;
    }
  }, [finalPrompt, variables]);

  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    try {
      // First, find the variable being updated
      const variableToUpdate = variables.find(v => v.id === variableId);
      if (!variableToUpdate) {
        console.error("Variable not found:", variableId);
        return;
      }
      
      const oldValue = variableToUpdate.value || "";
      const varName = variableToUpdate.name;
      
      // Create a new updatedPrompt using the utility function
      const updatedPrompt = replaceVariableInPrompt(finalPrompt, oldValue, newValue, varName);
      
      // Set the updated prompt
      setFinalPrompt(updatedPrompt);
      
      // Update the variable in state
      setVariables(currentVars => {
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
  }, [setVariables, setFinalPrompt, finalPrompt, variables]);

  const handleOpenEditPrompt = useCallback(() => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  }, [finalPrompt, setEditingPrompt, setShowEditPromptSheet]);

  const handleSaveEditedPrompt = useCallback((editedPrompt: string) => {
    setFinalPrompt(editedPrompt);
    
    const promptVariableNames = extractVariablesFromPrompt(editedPrompt);
    
    setVariables((currentVars: Variable[]) => {
      if (!Array.isArray(currentVars)) {
        console.error("Invalid variables array in handleSaveEditedPrompt:", currentVars);
        return [];
      }
      
      const existingVars = currentVars.filter(v => 
        promptVariableNames.includes(v.name)
      );
      
      const newVars = promptVariableNames
        .filter(name => !currentVars.some(v => v.name === name))
        .map((name, index) => ({
          id: `v-new-${Date.now()}-${index}`,
          name,
          value: "",
          isRelevant: true,
          category: "Custom",
          code: `VAR_${index + 1}` // Generate a code for new variables
        }));
      
      const updatedVars = existingVars.map(v => ({
        ...v,
        isRelevant: true
      }));
      
      return [...updatedVars, ...newVars];
    });
    
    setShowEditPromptSheet(false);
    
    toast({
      title: "Prompt updated",
      description: "Your prompt has been updated with new variables.",
    });
  }, [setFinalPrompt, extractVariablesFromPrompt, setVariables, setShowEditPromptSheet, toast]);

  const handleAdaptPrompt = useCallback(() => {
    handleSaveEditedPrompt(editingPrompt);
    
    toast({
      title: "Prompt adapted",
      description: "Your prompt has been adapted and saved.",
    });
  }, [handleSaveEditedPrompt, editingPrompt, toast]);

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

  const handleRegenerate = useCallback(() => {
    toast({
      title: "Regenerating prompt",
      description: "This feature will regenerate your prompt with the current inputs.",
    });
  }, [toast]);

  return {
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    isCopied
  };
};
