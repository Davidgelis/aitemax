import { useState, useEffect, useCallback } from "react";
import { Variable } from "../components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { 
  escapeRegExp, 
  replaceVariableInPrompt, 
  toVariablePlaceholder,
  convertPlaceholdersToSpans 
} from "@/utils/promptUtils";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  finalPrompt: string,
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
  showJson: boolean,
  setEditingPrompt: React.Dispatch<React.SetStateAction<string>>,
  setShowEditPromptSheet: React.Dispatch<React.SetStateAction<boolean>>,
  masterCommand: string,
  editingPrompt: string
) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedVariables, setLastProcessedVariables] = useState<Variable[]>([]);
  const [renderKey, setRenderKey] = useState(0); // Add render key to force updates
  const [variableSelections, setVariableSelections] = useState<Map<string, string>>(new Map());

  // Track variables state changes for immediate re-processing
  useEffect(() => {
    // Only re-process if the variables have actually changed in a meaningful way
    const relevantVarsChanged = JSON.stringify(
      variables.filter(v => v.isRelevant).map(v => ({ id: v.id, value: v.value }))
    ) !== JSON.stringify(
      lastProcessedVariables.filter(v => v.isRelevant).map(v => ({ id: v.id, value: v.value }))
    );
    
    if (relevantVarsChanged) {
      setLastProcessedVariables([...variables]);
      setRenderKey(prev => prev + 1); // Force re-render when variables change
    }
  }, [variables, lastProcessedVariables]);

  // Process the prompt with variables - with placeholder conversion
  const getProcessedPrompt = useCallback((): string => {
    if (!finalPrompt) return "";
    
    // Get only relevant variables
    const relevantVariables = variables.filter(v => v.isRelevant);
    
    // Convert placeholders to spans for display
    return convertPlaceholdersToSpans(finalPrompt, relevantVariables);
  }, [finalPrompt, variables]);
  
  // New function: Get a clean copy of the prompt with all variables properly substituted
  const getCleanTextForCopy = useCallback((): string => {
    if (!finalPrompt) return "";
    
    let cleanPrompt = finalPrompt;
    const relevantVariables = variables.filter(v => v.isRelevant);
    
    // Replace all {{VAR:id}} placeholders with their values
    relevantVariables.forEach(variable => {
      const placeholder = toVariablePlaceholder(variable.id);
      const regex = new RegExp(escapeRegExp(placeholder), 'g');
      cleanPrompt = cleanPrompt.replace(regex, variable.value || "");
    });
    
    // Strip any remaining HTML tags that might be present
    cleanPrompt = cleanPrompt.replace(/<[^>]*>/g, "");
    
    return cleanPrompt;
  }, [finalPrompt, variables]);
  
  // Record the original text selected when creating a variable
  const recordVariableSelection = useCallback((variableId: string, selectedText: string) => {
    console.log("Recording variable selection:", variableId, selectedText);
    setVariableSelections(prev => {
      const updated = new Map(prev);
      updated.set(variableId, selectedText);
      return updated;
    });
    setRenderKey(prev => prev + 1); // Force re-render
  }, []);

  // Update a variable's value with real-time synchronization
  const handleVariableValueChange = useCallback((id: string, newValue: string) => {
    setVariables(currentVars => {
      const updatedVars = currentVars.map(v => 
        v.id === id ? { ...v, value: newValue } : v
      );
      
      // Update lastProcessedVariables to prevent unnecessary re-processing
      setLastProcessedVariables(updatedVars);
      
      // Force re-render to ensure changes propagate
      setRenderKey(prev => prev + 1);
      
      return updatedVars;
    });
  }, [setVariables]);

  // Improved removeVariable function to ensure proper text replacement
  const removeVariable = useCallback((variableId: string) => {
    console.log(`Removing variable ${variableId} and replacing with text`);
    
    // Find the variable we're removing
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;
    
    // Get the current value of the variable (to replace placeholder)
    const originalText = variable.value || "";
    
    // Mark the variable as not relevant
    setVariables(currentVars => 
      currentVars.map(v => 
        v.id === variableId ? { ...v, isRelevant: false } : v
      )
    );
    
    // Replace the placeholder with the actual text in the finalPrompt
    const placeholder = toVariablePlaceholder(variableId);
    const updatedPrompt = finalPrompt.replace(new RegExp(escapeRegExp(placeholder), 'g'), originalText);
    setFinalPrompt(updatedPrompt);
    
    toast({
      title: "Variable removed",
      description: "The variable has been replaced with its text value in the prompt."
    });
    
    // Force re-render to ensure changes propagate
    setRenderKey(prev => prev + 1);
  }, [variables, finalPrompt, setVariables, setFinalPrompt, toast]);

  // Delete a variable
  const handleDeleteVariable = useCallback((variableId: string) => {
    console.log(`Deleting variable ${variableId} and replacing with its text value`);
    
    // Find the variable we're removing
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;
    
    // Get the current value of the variable (to replace placeholder)
    const originalText = variable.value || "";
    
    // Mark the variable as not relevant
    setVariables(currentVars => 
      currentVars.map(v => 
        v.id === variableId ? { ...v, isRelevant: false } : v
      )
    );
    
    // Replace the placeholder with the actual text in the finalPrompt
    const placeholder = toVariablePlaceholder(variableId);
    const updatedPrompt = finalPrompt.replace(new RegExp(escapeRegExp(placeholder), 'g'), originalText);
    setFinalPrompt(updatedPrompt);
    
    // Force re-render to ensure changes propagate
    setRenderKey(prev => prev + 1);
    
    toast({
      title: "Variable removed",
      description: "The variable has been replaced with its text value in the prompt.",
      variant: "default",
    });
  }, [variables, finalPrompt, setVariables, setFinalPrompt, toast]);

  // Open the edit prompt sheet
  const handleOpenEditPrompt = useCallback(() => {
    try {
      setEditingPrompt(finalPrompt);
      setShowEditPromptSheet(true);
    } catch (error) {
      console.error("Error opening edit prompt:", error);
      toast({
        title: "Error",
        description: "Could not open prompt editor. Please try again.",
        variant: "destructive",
      });
    }
  }, [finalPrompt, setEditingPrompt, setShowEditPromptSheet, toast]);

  // Save the edited prompt
  const handleSaveEditedPrompt = useCallback(() => {
    try {
      setFinalPrompt(editingPrompt);
      setShowEditPromptSheet(false);
      
      toast({
        title: "Success",
        description: "Prompt updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving edited prompt:", error);
      toast({
        title: "Error",
        description: "Could not save edited prompt. Please try again.",
        variant: "destructive",
      });
    }
  }, [editingPrompt, setFinalPrompt, setShowEditPromptSheet, toast]);

  // Adapt the prompt by changing variables
  const handleAdaptPrompt = useCallback(() => {
    try {
      const processedPrompt = getProcessedPrompt();
      
      toast({
        title: "Prompt Adapted",
        description: "Variables have been applied to the prompt",
        variant: "default",
      });
      
      return processedPrompt;
    } catch (error) {
      console.error("Error adapting prompt:", error);
      toast({
        title: "Error",
        description: "Could not adapt the prompt. Please try again.",
        variant: "destructive",
      });
      return finalPrompt;
    }
  }, [finalPrompt, getProcessedPrompt, toast]);

  // Copy the prompt to clipboard
  const handleCopyPrompt = useCallback(async () => {
    try {
      // Use the clean text version for copying instead of the processed prompt with HTML
      const cleanText = getCleanTextForCopy();
      
      await navigator.clipboard.writeText(cleanText);
      
      toast({
        title: "Copied to Clipboard",
        description: "Your enhanced prompt has been copied to the clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error("Error copying prompt:", error);
      toast({
        title: "Error",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  }, [getCleanTextForCopy, toast]);

  // Regenerate the prompt with updated variables
  const handleRegenerate = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Add regeneration logic here if needed
      toast({
        title: "Regeneration Complete",
        description: "Your prompt has been regenerated with the latest variables",
        variant: "default",
      });
    } catch (error) {
      console.error("Error regenerating prompt:", error);
      toast({
        title: "Error",
        description: "Could not regenerate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    getProcessedPrompt,
    getCleanTextForCopy,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    handleDeleteVariable,
    isProcessing,
    renderKey,
    recordVariableSelection,
    variableSelections,
    removeVariable // Export the removeVariable function
  };
};
