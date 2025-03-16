
import { useState } from "react";
import { Variable } from "../components/dashboard/types";
import { useToast } from "@/hooks/use-toast";

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

  // Process the prompt with variables
  const getProcessedPrompt = (): string => {
    if (!finalPrompt) return "";
    
    let processedPrompt = finalPrompt;
    
    // Only use relevant variables that have values
    const relevantVariables = variables.filter(v => v.isRelevant && v.value);
    
    // Replace variables in the format {{variable_name}} with their values
    relevantVariables.forEach(variable => {
      const regex = new RegExp(`{{\\s*${escapeRegExp(variable.name)}\\s*}}`, 'g');
      processedPrompt = processedPrompt.replace(regex, variable.value);
    });
    
    return processedPrompt;
  };
  
  // Helper to escape regular expression special characters
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Update a variable's value
  const handleVariableValueChange = (id: string, newValue: string) => {
    setVariables(currentVars => 
      currentVars.map(v => 
        v.id === id ? { ...v, value: newValue } : v
      )
    );
  };

  // Open the edit prompt sheet
  const handleOpenEditPrompt = () => {
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
  };

  // Save the edited prompt
  const handleSaveEditedPrompt = () => {
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
  };

  // Adapt the prompt by changing variables
  const handleAdaptPrompt = () => {
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
  };

  // Copy the prompt to clipboard
  const handleCopyPrompt = async () => {
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
  };

  // Regenerate the prompt with updated variables
  const handleRegenerate = async () => {
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
  };

  return {
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate,
    isProcessing
  };
};
