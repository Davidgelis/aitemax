
// This is a simplified implementation to show how the jsonStructure prop would be integrated
// into the existing usePromptOperations hook
import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Variable } from "@/components/dashboard/types";
import { convertPlaceholdersToSpans, createPlainTextPrompt } from "@/utils/promptUtils";
import { useToast } from "@/hooks/use-toast";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  finalPrompt: string,
  setFinalPrompt: (prompt: string) => void,
  showJson: boolean,
  setEditingPrompt: (prompt: string) => void,
  setShowEditPromptSheet: (show: boolean) => void,
  masterCommand: string,
  editingPrompt: string,
  jsonStructure?: any
) => {
  const [internalJsonStructure, setInternalJsonStructure] = useState<any>(jsonStructure || null);
  const { toast } = useToast();

  // Ensure the jsonStructure is updated when it changes from props
  useEffect(() => {
    if (jsonStructure) {
      setInternalJsonStructure(jsonStructure);
    }
  }, [jsonStructure]);

  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    setVariables(prevVars => {
      if (!Array.isArray(prevVars)) return [];
      
      return prevVars.map(v => 
        v.id === variableId ? { ...v, value: newValue } : v
      );
    });
  }, [setVariables]);

  const recordVariableSelection = useCallback((variableId: string, selectedText: string) => {
    if (!selectedText || !variableId) return;
    
    setVariables(prevVars => {
      if (!Array.isArray(prevVars)) return [];
      
      return prevVars.map(v => {
        if (v.id === variableId) {
          // If the variable already has a value, don't overwrite it
          if (!v.value || v.value.trim() === '') {
            return { ...v, value: selectedText };
          }
        }
        return v;
      });
    });
  }, [setVariables]);

  const removeVariable = useCallback((variableId: string) => {
    setVariables(prevVars => {
      if (!Array.isArray(prevVars)) return [];
      
      // First, find the variable to be removed
      const varToRemove = prevVars.find(v => v.id === variableId);
      if (!varToRemove) return prevVars;
      
      // Remove the variable from the array
      const updatedVars = prevVars.filter(v => v.id !== variableId);
      
      // If the variable was relevant, update the prompt to remove its placeholder
      if (varToRemove.isRelevant && varToRemove.name) {
        const placeholder = `{{${varToRemove.name}}}`;
        const updatedPrompt = finalPrompt.replace(new RegExp(placeholder, 'g'), '');
        setFinalPrompt(updatedPrompt);
      }
      
      return updatedVars;
    });
  }, [setVariables, finalPrompt, setFinalPrompt]);

  const getProcessedPrompt = useCallback(() => {
    if (!finalPrompt) return "";
    // Ensure we're only using variables that are actually in the array
    const safeVariables = Array.isArray(variables) ? variables.filter(v => v && v.isRelevant === true) : [];
    return convertPlaceholdersToSpans(finalPrompt, safeVariables);
  }, [finalPrompt, variables]);

  const createVariable = useCallback((name: string, value: string = "", category: string = "Other") => {
    const newVariable: Variable = {
      id: uuidv4(),
      name,
      value,
      isRelevant: true,
      category,
      code: ''
    };
    
    setVariables(prevVars => {
      if (!Array.isArray(prevVars)) return [newVariable];
      return [...prevVars, newVariable];
    });
    
    return newVariable;
  }, [setVariables]);

  const updatePromptWithVariable = useCallback((variableName: string, selectedText: string) => {
    if (!variableName || !selectedText || !finalPrompt) return;
    
    // Create the placeholder
    const placeholder = `{{${variableName}}}`;
    
    // Replace the selected text with the placeholder
    const updatedPrompt = finalPrompt.replace(selectedText, placeholder);
    setFinalPrompt(updatedPrompt);
    
    // Also update the editing prompt if it's open
    if (editingPrompt) {
      const updatedEditingPrompt = editingPrompt.replace(selectedText, placeholder);
      setEditingPrompt(updatedEditingPrompt);
    }
  }, [finalPrompt, setFinalPrompt, editingPrompt, setEditingPrompt]);

  const handleOpenEditPrompt = useCallback(() => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  }, [finalPrompt, setEditingPrompt, setShowEditPromptSheet]);

  const handleSaveEditedPrompt = useCallback(() => {
    setFinalPrompt(editingPrompt);
    setShowEditPromptSheet(false);
  }, [editingPrompt, setFinalPrompt, setShowEditPromptSheet]);

  // Add the missing functions
  const handleCopyPrompt = useCallback(() => {
    // Use our utility to get clean plain text without HTML or placeholders
    const textToCopy = createPlainTextPrompt(finalPrompt, variables.filter(v => v && v.isRelevant === true));
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast({
            title: "Copied to clipboard",
            description: "Prompt has been copied to clipboard",
          });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({
            title: "Copy failed",
            description: "Could not copy text to clipboard",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Copy failed",
        description: "Your browser doesn't support clipboard operations",
        variant: "destructive",
      });
    }
  }, [finalPrompt, variables, toast]);

  const handleRegenerate = useCallback(() => {
    toast({
      title: "Regenerating",
      description: "Regenerating prompt structure...",
    });
    // This function is typically implemented in the component that uses this hook
    // and passed down to it. For now, we'll make it a stub.
  }, [toast]);

  const handleAdaptPrompt = useCallback(() => {
    toast({
      title: "Adapting prompt",
      description: "Adapting the prompt based on current settings...",
    });
    // This function is typically implemented in the component that uses this hook
    // and passed down to it. For now, we'll make it a stub.
  }, [toast]);

  return {
    handleVariableValueChange,
    recordVariableSelection,
    removeVariable,
    getProcessedPrompt,
    jsonStructure: internalJsonStructure,
    setJsonStructure: setInternalJsonStructure,
    createVariable,
    updatePromptWithVariable,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    // Add the missing functions
    handleCopyPrompt,
    handleRegenerate,
    handleAdaptPrompt
  };
};
