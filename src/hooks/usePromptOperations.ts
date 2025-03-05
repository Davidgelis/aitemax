
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";

export const usePromptOperations = (
  variables: Variable[],
  setVariables: (variables: Variable[]) => void,
  finalPrompt: string,
  showJson: boolean,
  setEditingPrompt: (prompt: string) => void,
  setShowEditPromptSheet: (show: boolean) => void,
  masterCommand: string
) => {
  const { toast } = useToast();

  // Process the prompt to replace variables and highlight them
  const getProcessedPrompt = () => {
    let processedPrompt = finalPrompt;
    
    // First look for variable names in the prompt
    variables.forEach(variable => {
      if (variable.isRelevant && variable.name) {
        // Use both versions of the variable format
        const placeholder1 = `{{${variable.name}}}`;
        const placeholder2 = variable.name;
        
        const highlightedValue = `<span class="bg-[#33fea6]/20 px-1 rounded border border-[#33fea6]/30">${variable.value || placeholder2}</span>`;
        
        // Replace {{variableName}} format first
        processedPrompt = processedPrompt.replace(
          new RegExp(placeholder1, 'g'), 
          showJson ? variable.value || placeholder2 : highlightedValue
        );
        
        // Look for exact variable name matches, but be careful not to replace partial matches
        const safeVariableName = placeholder2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactMatchRegex = new RegExp(`\\b${safeVariableName}\\b`, 'g');
        
        processedPrompt = processedPrompt.replace(
          exactMatchRegex, 
          showJson ? variable.value || placeholder2 : highlightedValue
        );
      }
    });
    
    return processedPrompt;
  };

  const handleVariableValueChange = (variableId: string, newValue: string) => {
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, value: newValue } : v
    ));
  };

  const handleOpenEditPrompt = () => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  };

  const handleSaveEditedPrompt = () => {
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt updated successfully",
    });
  };

  const handleAdaptPrompt = () => {
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt adapted successfully",
    });
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(showJson ? JSON.stringify({ 
        prompt: finalPrompt, 
        masterCommand,
        variables: variables.filter(v => v.isRelevant === true)
      }, null, 2) : finalPrompt);
      
      toast({
        title: "Success",
        description: "Prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    toast({
      title: "Success",
      description: "Prompt regenerated successfully",
    });
  };

  return {
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate
  };
};
