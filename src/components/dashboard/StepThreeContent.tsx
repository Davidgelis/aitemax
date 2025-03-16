
import { useState, useEffect, useCallback } from "react";
import { Variable } from "./types";
import { MasterCommandSection } from "./step-three/MasterCommandSection";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { EditPromptSheet } from "./step-three/EditPromptSheet";
import { StepThreeStyles } from "./step-three/StepThreeStyles";
import { useToast } from "@/hooks/use-toast";

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
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: (editingPrompt: string) => void;
  handleAdaptPrompt: () => void;
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
  getProcessedPrompt,
  variables,
  setVariables,
  handleVariableValueChange,
  handleCopyPrompt,
  handleSavePrompt,
  handleRegenerate,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt
}: StepThreeContentProps) => {
  const { toast } = useToast();
  const [safeVariables, setSafeVariables] = useState<Variable[]>([]);
  const [safeProcessedPrompt, setSafeProcessedPrompt] = useState("");
  
  // Force re-render when variables change
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // Update render trigger when variables change
  useEffect(() => {
    setRenderTrigger(prev => prev + 1);
  }, [variables]);
  
  // Safely get the processed prompt
  const safeGetProcessedPrompt = useCallback(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        return getProcessedPrompt() || "";
      }
      return finalPrompt || "";
    } catch (error) {
      console.error("Error getting processed prompt:", error);
      return finalPrompt || "";
    }
  }, [getProcessedPrompt, finalPrompt, renderTrigger]);

  // Update the safe processed prompt when dependencies change
  useEffect(() => {
    try {
      const processed = safeGetProcessedPrompt();
      setSafeProcessedPrompt(processed);
    } catch (error) {
      console.error("Error updating processed prompt:", error);
    }
  }, [safeGetProcessedPrompt, variables, finalPrompt, renderTrigger]);
  
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
  
  // Safe wrapper for variable value changes
  const safeHandleVariableValueChange = (variableId: string, newValue: string) => {
    try {
      if (typeof handleVariableValueChange === 'function') {
        handleVariableValueChange(variableId, newValue);
        // Force an immediate re-render after variable change
        setRenderTrigger(prev => prev + 1);
      } else {
        throw new Error("handleVariableValueChange is not a function");
      }
    } catch (error) {
      console.error("Error changing variable value:", error);
      toast({
        title: "Error updating variable",
        description: "An error occurred while trying to update the variable",
        variant: "destructive"
      });
    }
  };

  // Safely update variables
  const safeSetVariables = (updater: React.SetStateAction<Variable[]>) => {
    try {
      setVariables(updater);
      // Force re-render
      setRenderTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error updating variables:", error);
      toast({
        title: "Error updating variables",
        description: "An error occurred while trying to update variables",
        variant: "destructive"
      });
    }
  };

  // Wrapper function to adapt the handleSaveEditedPrompt to match EditPromptSheet's onSave prop type
  const handleSaveEdited = () => {
    handleSaveEditedPrompt(editingPrompt);
  };

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      {/* MasterCommandSection is intentionally removed as requested */}

      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
      />

      <FinalPromptDisplay 
        finalPrompt={finalPrompt || ""}
        getProcessedPrompt={safeGetProcessedPrompt}
        variables={safeVariables}
        setVariables={safeSetVariables}
        showJson={showJson}
        masterCommand={masterCommand || ""}
        handleOpenEditPrompt={handleOpenEditPrompt}
      />

      <VariablesSection 
        variables={safeVariables.filter(v => v.isRelevant === true)}
        handleVariableValueChange={safeHandleVariableValueChange}
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
