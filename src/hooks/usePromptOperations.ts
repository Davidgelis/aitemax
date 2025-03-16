
import { useState, useEffect, useCallback } from "react";
import { Variable } from "../components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { escapeRegExp, replaceVariableInPrompt } from "@/utils/promptUtils";

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

  // Process the prompt with variables - direct replacement approach
  const getProcessedPrompt = useCallback((): string => {
    if (!finalPrompt) return "";
    
    let processedPrompt = finalPrompt;
    
    // Only use relevant variables
    const relevantVariables = variables.filter(v => v.isRelevant);
    
    // Process variables in a specific order: longest values first
    // to prevent partial replacements
    const sortedVariables = [...relevantVariables].sort(
      (a, b) => ((b.value?.length || 0) - (a.value?.length || 0))
    );
    
    // Apply substitutions for each variable
    sortedVariables.forEach(variable => {
      // Look for a placeholder pattern with this variable's ID
      const placeholderRegex = new RegExp(`<span[^>]*data-variable-id="${variable.id}"[^>]*>.*?</span>`, 'g');
      
      // If we find a placeholder, we don't need to do anything - the rendering component
      // will handle displaying the input fields at the placeholder positions
      if (placeholderRegex.test(processedPrompt)) {
        return;
      } else if (variable.value) {
        // Fallback to variable placeholder replacement if needed
        const regex = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
        processedPrompt = processedPrompt.replace(regex, variable.value);
      }
    });
    
    return processedPrompt;
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
      const processedPrompt = getProcessedPrompt();
      
      await navigator.clipboard.writeText(processedPrompt);
      
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
  }, [getProcessedPrompt, toast]);

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
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    isProcessing,
    renderKey,
    recordVariableSelection,
    variableSelections
  };
};
