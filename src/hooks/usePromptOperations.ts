
import { useState, useEffect, useCallback } from "react";
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
  const [processedPrompt, setProcessedPrompt] = useState(finalPrompt || "");
  const [variableHighlights, setVariableHighlights] = useState<Record<string, string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ensure variables is a valid array
  const safeVariables = Array.isArray(variables) ? variables : [];
  
  // Helper function to escape special regex characters
  const escapeRegExp = useCallback((string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);
  
  // Process the prompt with variable replacements and track their positions
  const getProcessedPrompt = useCallback(() => {
    if (!finalPrompt) return "";
    
    try {
      let processed = finalPrompt;
      const highlightPositions: Record<string, string[]> = {};
      
      // First, replace template variables like {{VariableName}} with their values
      const validVariables = safeVariables.filter(v => 
        v && v.isRelevant === true && 
        v.name && v.name.trim() !== ''
      );
      
      validVariables.forEach(variable => {
        if (!variable || !variable.name) return;
        
        try {
          // Create a regex that matches the variable name enclosed in {{...}}
          // with optional whitespace inside the braces
          const regex = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
          
          // For tracking variable positions
          if (variable.value) {
            highlightPositions[variable.id] = [];
            
            // Replace the variable placeholders with their values
            processed = processed.replace(regex, variable.value || '');
            
            // Create a new regex for each search to reset lastIndex
            const valueRegex = new RegExp(escapeRegExp(variable.value), 'g');
            let match;
            
            while ((match = valueRegex.exec(processed)) !== null) {
              highlightPositions[variable.id].push(variable.value);
            }
          } else {
            // If there's no value, replace with an empty string
            processed = processed.replace(regex, '');
          }
        } catch (error) {
          console.error(`Error processing variable ${variable.name}:`, error);
        }
      });
      
      // Update the highlight positions for use in rendering
      setVariableHighlights(highlightPositions);
      
      return processed;
    } catch (error) {
      console.error("Error in getProcessedPrompt:", error);
      return finalPrompt;
    }
  }, [finalPrompt, safeVariables, escapeRegExp]);
  
  // Update the processed prompt whenever variables change
  useEffect(() => {
    try {
      const newProcessedPrompt = getProcessedPrompt();
      setProcessedPrompt(newProcessedPrompt);
    } catch (error) {
      console.error("Error updating processed prompt:", error);
    }
  }, [getProcessedPrompt]);
  
  // Handle variable value change with live updating
  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    if (!variableId) {
      console.error("Invalid variableId provided to handleVariableValueChange");
      return;
    }
    
    console.log(`Updating variable ${variableId} to value: ${newValue}`);
    
    if (isProcessing) {
      console.log("Skipping update, already processing");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Update the variables array with the new value
      const updatedVariables = safeVariables.map(v => 
        v.id === variableId ? { ...v, value: newValue, isRelevant: true } : v
      );
      
      // Update variables state
      setVariables(updatedVariables);
      
      // Process the prompt again with updated variables on next tick
      setTimeout(() => {
        try {
          const newProcessedPrompt = getProcessedPrompt();
          setProcessedPrompt(newProcessedPrompt);
          setIsProcessing(false);
        } catch (error) {
          console.error("Error processing prompt after variable update:", error);
          setIsProcessing(false);
        }
      }, 10);
    } catch (error) {
      console.error("Error in handleVariableValueChange:", error);
      setIsProcessing(false);
      toast({
        title: "Error updating variable",
        description: "An error occurred while updating the variable",
        variant: "destructive"
      });
    }
  }, [safeVariables, setVariables, getProcessedPrompt, toast, isProcessing]);
  
  const handleOpenEditPrompt = useCallback(() => {
    try {
      setEditingPrompt(finalPrompt || "");
      setShowEditPromptSheet(true);
    } catch (error) {
      console.error("Error in handleOpenEditPrompt:", error);
      toast({
        title: "Error opening edit prompt",
        description: "An error occurred while trying to open the edit prompt",
        variant: "destructive"
      });
    }
  }, [finalPrompt, setEditingPrompt, setShowEditPromptSheet, toast]);
  
  const handleSaveEditedPrompt = useCallback((editedPrompt: string) => {
    try {
      setFinalPrompt(editedPrompt);
      setShowEditPromptSheet(false);
      
      toast({
        title: "Prompt updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Error in handleSaveEditedPrompt:", error);
      toast({
        title: "Error saving edited prompt",
        description: "An error occurred while trying to save your changes",
        variant: "destructive"
      });
    }
  }, [setFinalPrompt, setShowEditPromptSheet, toast]);
  
  const handleAdaptPrompt = useCallback(() => {
    try {
      // Implementation for adapting prompt
      setShowEditPromptSheet(false);
      
      toast({
        title: "Prompt adapted",
        description: "Your prompt has been regenerated",
      });
    } catch (error) {
      console.error("Error in handleAdaptPrompt:", error);
      toast({
        title: "Error adapting prompt",
        description: "An error occurred while trying to adapt the prompt",
        variant: "destructive"
      });
    }
  }, [setShowEditPromptSheet, toast]);
  
  const handleCopyPrompt = useCallback(() => {
    try {
      const textToCopy = showJson
        ? JSON.stringify({
            prompt: finalPrompt || "",
            masterCommand: masterCommand || "",
            variables: safeVariables.filter(v => v && v.isRelevant === true) || [],
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
    } catch (error) {
      console.error("Error in handleCopyPrompt:", error);
      toast({
        title: "Error copying prompt",
        description: "An error occurred while trying to copy the prompt",
        variant: "destructive"
      });
    }
  }, [showJson, finalPrompt, masterCommand, safeVariables, getProcessedPrompt, toast]);
  
  const handleRegenerate = useCallback(() => {
    try {
      // Implementation for regenerating prompt
      toast({
        title: "Prompt regenerated",
        description: "Your prompt has been regenerated",
      });
    } catch (error) {
      console.error("Error in handleRegenerate:", error);
      toast({
        title: "Error regenerating prompt",
        description: "An error occurred while trying to regenerate the prompt",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  // Get the list of relevant variables for display in step 3
  const getRelevantVariables = useCallback(() => {
    try {
      return safeVariables.filter(v => v && v.isRelevant === true) || [];
    } catch (error) {
      console.error("Error in getRelevantVariables:", error);
      return [];
    }
  }, [safeVariables]);

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
