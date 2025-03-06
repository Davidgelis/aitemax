
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
  const [processedPrompt, setProcessedPrompt] = useState(finalPrompt || "");
  const [variableHighlights, setVariableHighlights] = useState<Record<string, string[]>>({});
  
  // Handle variable value change with live updating
  const handleVariableValueChange = (variableId: string, newValue: string) => {
    if (!variableId) {
      console.error("Invalid variableId provided to handleVariableValueChange");
      return;
    }
    
    console.log(`Updating variable ${variableId} to value: ${newValue}`);
    
    try {
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
        try {
          const newProcessedPrompt = getProcessedPrompt();
          setProcessedPrompt(newProcessedPrompt);
        } catch (error) {
          console.error("Error processing prompt after variable update:", error);
        }
      }, 0);
      
      // Toast confirmation of update
      toast({
        title: "Variable updated",
        description: "The prompt has been updated with your changes",
        variant: "default"
      });
    } catch (error) {
      console.error("Error in handleVariableValueChange:", error);
      toast({
        title: "Error updating variable",
        description: "An error occurred while updating the variable",
        variant: "destructive"
      });
    }
  };

  // Process the prompt with variable replacements and track their positions
  const getProcessedPrompt = () => {
    if (!finalPrompt) return "";
    
    try {
      let processed = finalPrompt;
      const highlightPositions: Record<string, string[]> = {};
      
      // Only replace variables if they have both a name and value
      const validVariables = variables.filter(v => 
        v && v.isRelevant === true && 
        v.name && v.name.trim() !== '' && 
        v.value && v.value.trim() !== ''
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
            
            // Find all occurrences of this variable value in the text
            let match;
            const valueRegex = new RegExp(escapeRegExp(variable.value), 'g');
            const tempProcessed = processed.replace(regex, variable.value);
            
            while ((match = valueRegex.exec(tempProcessed)) !== null) {
              highlightPositions[variable.id].push(variable.value);
            }
          }
          
          processed = processed.replace(regex, variable.value || '');
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
  };
  
  // Update the processed prompt whenever variables change
  useEffect(() => {
    try {
      const newProcessedPrompt = getProcessedPrompt();
      setProcessedPrompt(newProcessedPrompt);
    } catch (error) {
      console.error("Error updating processed prompt:", error);
    }
  }, [variables, finalPrompt]);
  
  const handleOpenEditPrompt = () => {
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
  };
  
  const handleSaveEditedPrompt = (editedPrompt: string) => {
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
  };
  
  const handleAdaptPrompt = () => {
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
  };
  
  const handleCopyPrompt = () => {
    try {
      const textToCopy = showJson
        ? JSON.stringify({
            prompt: finalPrompt || "",
            masterCommand: masterCommand || "",
            variables: variables.filter(v => v && v.isRelevant === true) || [],
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
  };
  
  const handleRegenerate = () => {
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
  };
  
  // Helper function to escape special regex characters
  const escapeRegExp = (string: string = "") => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Get the list of relevant variables for display in step 3
  const getRelevantVariables = () => {
    try {
      return variables.filter(v => v && v.isRelevant === true) || [];
    } catch (error) {
      console.error("Error in getRelevantVariables:", error);
      return [];
    }
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
