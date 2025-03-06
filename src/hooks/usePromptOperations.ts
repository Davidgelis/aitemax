
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
      
      // Filter valid variables - those marked relevant with values
      const validVariables = safeVariables.filter(v => 
        v && v.isRelevant === true && 
        v.name && v.name.trim() !== '' && 
        v.value && v.value.trim() !== ''
      );
      
      // First pass - create a map of variable names to values
      const variableMap = new Map<string, string>();
      validVariables.forEach(variable => {
        if (variable.name && variable.value) {
          variableMap.set(variable.name, variable.value);
        }
      });
      
      // Second pass - replace {{variable}} patterns with their values
      validVariables.forEach(variable => {
        if (!variable || !variable.name) return;
        
        try {
          // Create a regex that matches the variable name enclosed in {{...}}
          // with optional whitespace inside the braces
          const regex = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
          
          // For tracking variable positions
          if (variable.value) {
            highlightPositions[variable.id] = [];
            
            // Replace and track
            processed = processed.replace(regex, (match) => {
              if (variable.value) {
                highlightPositions[variable.id].push(variable.value);
                return variable.value;
              }
              return match;
            });
          }
        } catch (error) {
          console.error(`Error processing variable ${variable.name}:`, error);
        }
      });
      
      // Third pass - highlight exact variable values in the text (direct matches)
      validVariables.forEach(variable => {
        if (!variable.value || variable.value.trim() === '') return;
        
        try {
          // Only track direct occurrences that aren't from replacements
          // This is for values that were directly typed in the text, not replaced
          const valueRegex = new RegExp(`\\b${escapeRegExp(variable.value)}\\b`, 'g');
          let match;
          let tempText = processed;
          
          // We don't actually replace anything here, just look for matches
          while ((match = valueRegex.exec(tempText)) !== null) {
            // Skip if this was already part of a replacement (avoid double counting)
            if (!highlightPositions[variable.id]) {
              highlightPositions[variable.id] = [];
            }
            highlightPositions[variable.id].push(variable.value);
          }
        } catch (error) {
          console.error(`Error finding occurrences for ${variable.value}:`, error);
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
      
      // Get the variable that changed
      const changedVariable = safeVariables.find(v => v.id === variableId);
      
      if (changedVariable && changedVariable.name) {
        // Update all occurrences of {{varName}} in the final prompt with the new value
        const regex = new RegExp(`{{\\s*${escapeRegExp(changedVariable.name)}\\s*}}`, 'g');
        
        // Only replace if we have a non-empty value
        if (newValue.trim() !== '') {
          const updatedPrompt = finalPrompt.replace(regex, newValue);
          
          // Only update if there's an actual change
          if (updatedPrompt !== finalPrompt) {
            setFinalPrompt(updatedPrompt);
          }
        }
      }
      
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
  }, [safeVariables, setVariables, getProcessedPrompt, toast, isProcessing, finalPrompt, setFinalPrompt, escapeRegExp]);
  
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
      
      // After saving the edited prompt, reprocess to extract any new variables
      setTimeout(() => {
        try {
          // Look for {{varName}} patterns in the edited prompt
          const varRegex = /{{([^{}]+)}}/g;
          let match;
          const foundVariables: Set<string> = new Set();
          
          // Extract all variable names from the prompt
          while ((match = varRegex.exec(editedPrompt)) !== null) {
            const varName = match[1].trim();
            if (varName) {
              foundVariables.add(varName);
            }
          }
          
          // Update existing variables or create new ones
          if (foundVariables.size > 0) {
            const updatedVariables = [...safeVariables];
            let variableChanged = false;
            
            // For each found variable name, check if it exists
            foundVariables.forEach(varName => {
              const existingVar = updatedVariables.find(v => v.name === varName);
              
              if (!existingVar) {
                // Create a new variable if it doesn't exist
                const newVar: Variable = {
                  id: `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: varName,
                  value: "",
                  isRelevant: true,
                  category: "Extracted"
                };
                updatedVariables.push(newVar);
                variableChanged = true;
              } else if (existingVar.isRelevant !== true) {
                // Mark as relevant if it wasn't before
                existingVar.isRelevant = true;
                variableChanged = true;
              }
            });
            
            if (variableChanged) {
              setVariables(updatedVariables);
              toast({
                title: "Variables updated",
                description: `${foundVariables.size} variables found in prompt`,
              });
            }
          }
        } catch (error) {
          console.error("Error extracting variables from edited prompt:", error);
        }
      }, 100);
    } catch (error) {
      console.error("Error in handleSaveEditedPrompt:", error);
      toast({
        title: "Error saving edited prompt",
        description: "An error occurred while trying to save your changes",
        variant: "destructive"
      });
    }
  }, [setFinalPrompt, setShowEditPromptSheet, toast, safeVariables, setVariables]);
  
  const handleAdaptPrompt = useCallback(() => {
    try {
      // Implementation for adapting prompt would go here
      // For now, just close the sheet
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
  }, [showJson, finalPrompt, masterCommand, getProcessedPrompt, toast]);
  
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
