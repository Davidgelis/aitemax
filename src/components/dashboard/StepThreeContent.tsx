
import { useState, useEffect, useCallback } from "react";
import { Variable } from "./types";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { StepThreeStyles } from "./step-three/StepThreeStyles";
import { useToast } from "@/hooks/use-toast";
import { usePromptOperations } from "@/hooks/usePromptOperations";

interface StepThreeContentProps {
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  finalPrompt: string;
  setFinalPrompt: (prompt: string) => void;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: () => void;
  getProcessedPrompt?: () => string;
  handleVariableValueChange?: (variableId: string, newValue: string) => void;
}

export const StepThreeContent = ({
  masterCommand,
  setMasterCommand,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  showJson,
  setShowJson,
  finalPrompt,
  setFinalPrompt,
  variables,
  setVariables,
  handleCopyPrompt: externalHandleCopyPrompt,
  handleSavePrompt,
  handleRegenerate: externalHandleRegenerate,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt: externalHandleOpenEditPrompt,
  handleSaveEditedPrompt: externalHandleSaveEditedPrompt,
  handleAdaptPrompt: externalHandleAdaptPrompt,
  getProcessedPrompt: externalGetProcessedPrompt,
  handleVariableValueChange: externalHandleVariableValueChange
}: StepThreeContentProps) => {
  const { toast } = useToast();
  const [safeVariables, setSafeVariables] = useState<Variable[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState("");
  
  const promptOperations = usePromptOperations(
    variables,
    setVariables,
    finalPrompt,
    setFinalPrompt,
    showJson,
    setEditingPrompt,
    setShowEditPromptSheet,
    masterCommand,
    editingPrompt
  );
  
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  useEffect(() => {
    setRenderTrigger(prev => prev + 1);
  }, [variables]);
  
  useEffect(() => {
    if (!variables || !Array.isArray(variables)) {
      console.error("Invalid variables provided to StepThreeContent:", variables);
      setSafeVariables([]);
      return;
    }
    
    const validVariables = variables.filter(v => v && typeof v === 'object');
    setSafeVariables(validVariables);
  }, [variables]);
  
  const enhancedHandleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    try {
      if (typeof externalHandleVariableValueChange === 'function') {
        externalHandleVariableValueChange(variableId, newValue);
      } else {
        promptOperations.handleVariableValueChange(variableId, newValue);
      }
      
      setRenderTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error changing variable value:", error);
      toast({
        title: "Error updating variable",
        description: "An error occurred while trying to update the variable",
        variant: "destructive"
      });
    }
  }, [externalHandleVariableValueChange, promptOperations.handleVariableValueChange, toast]);

  const handleSaveInlineEdit = useCallback(() => {
    try {
      // Apply the edited content to the finalPrompt
      setFinalPrompt(editablePrompt);
      
      // Process the prompt to ensure variable placeholders are preserved
      const relevantVars = variables.filter(v => v && v.isRelevant);
      let processedPrompt = editablePrompt;
      
      // Convert {{value::id}} format back to proper variable placeholders
      relevantVars.forEach(variable => {
        const doubleVarRegex = new RegExp(`{{[^:}]*::${variable.id}}}`, 'g');
        if (doubleVarRegex.test(processedPrompt)) {
          processedPrompt = processedPrompt.replace(
            doubleVarRegex, 
            `<span data-variable-id="${variable.id}" contenteditable="false" class="variable-highlight">${variable.value || ""}</span>`
          );
        }
      });
      
      // If any changes were made in the processing, update the prompt again
      if (processedPrompt !== editablePrompt) {
        setFinalPrompt(processedPrompt);
      }
      
      toast({
        title: "Success",
        description: "Prompt updated successfully",
        variant: "default",
      });
      
      // Force a re-render to ensure variables are displayed correctly
      setRenderTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error saving edited prompt:", error);
      toast({
        title: "Error",
        description: "Could not save edited prompt. Please try again.",
        variant: "destructive",
      });
    }
  }, [editablePrompt, setFinalPrompt, toast, variables]);

  const getProcessedPromptFunction = useCallback(() => {
    if (typeof externalGetProcessedPrompt === 'function') {
      return externalGetProcessedPrompt();
    }
    return promptOperations.getProcessedPrompt();
  }, [externalGetProcessedPrompt, promptOperations.getProcessedPrompt]);

  const recordVariableSelection = useCallback((variableId: string, selectedText: string) => {
    console.log("Recording variable selection:", variableId, selectedText);
    promptOperations.recordVariableSelection(variableId, selectedText);
  }, [promptOperations]);
  
  const handleDeleteVariable = useCallback((variableId: string) => {
    if (promptOperations.removeVariable) {
      promptOperations.removeVariable(variableId);
      toast({
        title: "Variable deleted",
        description: "The variable has been removed from your prompt",
      });
    }
  }, [promptOperations, toast]);

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
      />

      <FinalPromptDisplay 
        finalPrompt={finalPrompt || ""}
        updateFinalPrompt={setFinalPrompt}
        getProcessedPrompt={getProcessedPromptFunction}
        variables={safeVariables}
        setVariables={setVariables}
        showJson={showJson}
        masterCommand={masterCommand || ""}
        handleOpenEditPrompt={externalHandleOpenEditPrompt}
        recordVariableSelection={recordVariableSelection}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editablePrompt={editablePrompt}
        setEditablePrompt={setEditablePrompt}
        handleSaveEditedPrompt={handleSaveInlineEdit}
      />

      <VariablesSection 
        variables={safeVariables}
        handleVariableValueChange={enhancedHandleVariableValueChange}
        onDeleteVariable={handleDeleteVariable}
      />

      <ActionButtons 
        handleCopyPrompt={externalHandleCopyPrompt}
        handleSavePrompt={handleSavePrompt}
      />

      <StepThreeStyles />
    </div>
  );
};
