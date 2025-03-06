import { useState, useCallback } from "react";
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { extractVariablesFromPrompt } from "@/utils/promptUtils";

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
        v => v && v.isRelevant === true && v.name
      );
      
      if (relevantVariables.length === 0) {
        return finalPrompt;
      }
      
      let processedPrompt = finalPrompt;
      
      // First replace variables with their values if they have them
      relevantVariables.forEach(variable => {
        if (!variable.name || !variable.value) return;
        
        // Find all occurrences of the value in the text
        const valueRegex = new RegExp(variable.value, 'g');
        processedPrompt = processedPrompt.replace(valueRegex, `{{${variable.name}}}`);
      });
      
      // Then replace any remaining {{variable}} patterns with their values
      relevantVariables.forEach(variable => {
        if (!variable.name) return;
        
        const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        const replacement = variable.value || `{{${variable.name}}}`;
        processedPrompt = processedPrompt.replace(pattern, replacement);
      });
      
      return processedPrompt;
    } catch (error) {
      console.error("Error in getProcessedPrompt:", error);
      return finalPrompt;
    }
  }, [finalPrompt, variables]);

  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    try {
      setVariables(currentVars => {
        if (!Array.isArray(currentVars)) {
          console.error("Invalid variables array in handleVariableValueChange:", currentVars);
          return [];
        }
        
        // Find the variable being changed
        const variableToUpdate = currentVars.find(v => v.id === variableId);
        if (!variableToUpdate) return currentVars;
        
        // Get the old value and variable name
        const oldValue = variableToUpdate.value;
        const varName = variableToUpdate.name;
        
        // Update the final prompt text - fix the typing issue here
        if (oldValue) {
          // If there was an old value, replace it with the new one
          const updatedPrompt = finalPrompt.replace(new RegExp(oldValue, 'g'), newValue);
          setFinalPrompt(updatedPrompt);
        } else {
          // If there was no old value, look for {{varName}} pattern and replace it
          const pattern = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
          const updatedPrompt = finalPrompt.replace(pattern, newValue);
          setFinalPrompt(updatedPrompt);
        }
        
        // Update the variable in state
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
  }, [setVariables, setFinalPrompt, finalPrompt]);

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
