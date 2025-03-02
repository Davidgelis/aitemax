
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

  const getProcessedPrompt = () => {
    let processedPrompt = finalPrompt;
    variables.forEach(variable => {
      if (variable.isRelevant && variable.name && variable.value) {
        const placeholder = `{{${variable.name}}}`;
        const highlightedValue = `<span class="bg-[#33fea6]/20 px-1 rounded border border-[#33fea6]/30">${variable.value}</span>`;
        processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), showJson ? variable.value : highlightedValue);
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
