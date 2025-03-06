
import { useState, useEffect } from "react";
import { Variable } from "./types";
import { MasterCommandSection } from "./step-three/MasterCommandSection";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { EditPromptSheet } from "./step-three/EditPromptSheet";
import { StepThreeStyles } from "./step-three/StepThreeStyles";

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
  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <MasterCommandSection 
        masterCommand={masterCommand}
        setMasterCommand={setMasterCommand}
        handleRegenerate={handleRegenerate}
      />

      <ToggleSection 
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        handlePrimaryToggle={handlePrimaryToggle}
        handleSecondaryToggle={handleSecondaryToggle}
        showJson={showJson}
        setShowJson={setShowJson}
      />

      <FinalPromptDisplay 
        finalPrompt={finalPrompt}
        getProcessedPrompt={getProcessedPrompt}
        variables={variables}
        showJson={showJson}
        masterCommand={masterCommand}
        handleOpenEditPrompt={handleOpenEditPrompt}
      />

      <VariablesSection 
        variables={variables}
        handleVariableValueChange={handleVariableValueChange}
      />

      <ActionButtons 
        handleCopyPrompt={handleCopyPrompt}
        handleSavePrompt={handleSavePrompt}
      />

      <EditPromptSheet 
        showEditPromptSheet={showEditPromptSheet}
        setShowEditPromptSheet={setShowEditPromptSheet}
        editingPrompt={editingPrompt}
        setEditingPrompt={setEditingPrompt}
        handleSaveEditedPrompt={handleSaveEditedPrompt}
        handleAdaptPrompt={handleAdaptPrompt}
      />

      <StepThreeStyles />
    </div>
  );
};
