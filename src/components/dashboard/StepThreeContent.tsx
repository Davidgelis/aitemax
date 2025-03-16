
import { useState, useEffect, useCallback } from "react";
import { Variable } from "./types";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { EditPromptSheet } from "./step-three/EditPromptSheet";
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
  setFinalPrompt: (prompt: string) => void; // Add setter for finalPrompt
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
  // Add the getProcessedPrompt function to the props
  getProcessedPrompt?: () => string;
  // Add the handleVariableValueChange function to the props
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
  setFinalPrompt, // Add this prop
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
  
  // Use the prompt operations hook with proper setFinalPrompt function
  const promptOperations = usePromptOperations(
    variables,
    setVariables,
    finalPrompt,
    setFinalPrompt, // Pass the real setter function instead of no-op
    showJson,
    setEditingPrompt,
    setShowEditPromptSheet,
    masterCommand,
    editingPrompt
  );
  
  // Force re-render when variables change
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // Update render trigger when variables change
  useEffect(() => {
    setRenderTrigger(prev => prev + 1);
  }, [variables]);
  
  // Ensure we have valid variables
  useEffect(() => {
    if (!variables || !Array.isArray(variables)) {
      console.error("Invalid variables provided to StepThreeContent:", variables);
      setSafeVariables([]);
      return;
    }
    
    // Filter out any invalid variables
    const validVariables = variables.filter(v => v && typeof v === 'object');
    setSafeVariables(validVariables);
  }, [variables]);
  
  // Enhanced variable value change handler to ensure proper updates
  const enhancedHandleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    try {
      // Use external handler if provided, otherwise use our prompt operations hook
      if (typeof externalHandleVariableValueChange === 'function') {
        externalHandleVariableValueChange(variableId, newValue);
      } else {
        promptOperations.handleVariableValueChange(variableId, newValue);
      }
      
      // Force an immediate re-render after variable change
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

  // Wrapper functions to use our hook functions
  const handleOpenEditPrompt = useCallback(() => {
    if (typeof externalHandleOpenEditPrompt === 'function') {
      externalHandleOpenEditPrompt();
    } else {
      promptOperations.handleOpenEditPrompt();
    }
  }, [externalHandleOpenEditPrompt, promptOperations.handleOpenEditPrompt]);

  const handleCopyPrompt = useCallback(() => {
    if (typeof externalHandleCopyPrompt === 'function') {
      externalHandleCopyPrompt();
    } else {
      promptOperations.handleCopyPrompt();
    }
  }, [externalHandleCopyPrompt, promptOperations.handleCopyPrompt]);

  const handleSaveEdited = useCallback(() => {
    if (typeof externalHandleSaveEditedPrompt === 'function') {
      externalHandleSaveEditedPrompt();
    } else {
      promptOperations.handleSaveEditedPrompt();
    }
  }, [externalHandleSaveEditedPrompt, promptOperations.handleSaveEditedPrompt]);

  // Add a function to handle getProcessedPrompt
  const getProcessedPromptFunction = useCallback(() => {
    if (typeof externalGetProcessedPrompt === 'function') {
      return externalGetProcessedPrompt();
    }
    return promptOperations.getProcessedPrompt();
  }, [externalGetProcessedPrompt, promptOperations.getProcessedPrompt]);

  // Handle recording variable selections
  const recordVariableSelection = useCallback((variableId: string, selectedText: string) => {
    promptOperations.recordVariableSelection(variableId, selectedText);
  }, [promptOperations]);

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      {/* MasterCommandSection is removed as requested */}

      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
      />

      <FinalPromptDisplay 
        finalPrompt={finalPrompt || ""}
        updateFinalPrompt={setFinalPrompt} // Pass the updateFinalPrompt function
        getProcessedPrompt={getProcessedPromptFunction}
        variables={safeVariables}
        setVariables={setVariables}
        showJson={showJson}
        masterCommand={masterCommand || ""}
        handleOpenEditPrompt={handleOpenEditPrompt}
        recordVariableSelection={recordVariableSelection}
      />

      <VariablesSection 
        variables={safeVariables}
        handleVariableValueChange={enhancedHandleVariableValueChange}
      />

      <ActionButtons 
        handleCopyPrompt={handleCopyPrompt}
        handleSavePrompt={handleSavePrompt}
      />

      <EditPromptSheet 
        open={showEditPromptSheet}
        onOpenChange={setShowEditPromptSheet}
        editingPrompt={editingPrompt || ""}
        setEditingPrompt={setEditingPrompt}
        onSave={handleSaveEdited}
        variables={safeVariables}
      />

      <StepThreeStyles />
    </div>
  );
};
