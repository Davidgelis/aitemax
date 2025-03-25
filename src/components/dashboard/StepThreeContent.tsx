import { useState, useEffect } from "react";
import { Question, Variable } from "@/components/dashboard/types";
import { MasterCommandSection } from "./step-three/MasterCommandSection";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { StepThreeStyles } from "./step-three/StepThreeStyles";

export interface StepThreeContentProps {
  masterCommand: string;
  setMasterCommand: React.Dispatch<React.SetStateAction<string>>;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  showJson: boolean;
  setShowJson: React.Dispatch<React.SetStateAction<boolean>>;
  finalPrompt: string;
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  handleVariableValueChange: (id: string, value: string) => void;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: () => void;
  getProcessedPrompt: () => string;
  selectedTemplateId: string | null;
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
  handleAdaptPrompt,
  getProcessedPrompt,
  selectedTemplateId
}: StepThreeContentProps) => {
  return (
    <StepThreeStyles>
      <MasterCommandSection
        masterCommand={masterCommand}
        setMasterCommand={setMasterCommand}
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
        setFinalPrompt={setFinalPrompt}
        editingPrompt={editingPrompt}
        setEditingPrompt={setEditingPrompt}
        showEditPromptSheet={showEditPromptSheet}
        setShowEditPromptSheet={setShowEditPromptSheet}
        handleOpenEditPrompt={handleOpenEditPrompt}
        handleSaveEditedPrompt={handleSaveEditedPrompt}
        handleAdaptPrompt={handleAdaptPrompt}
        getProcessedPrompt={getProcessedPrompt}
      />

      <VariablesSection
        variables={variables}
        setVariables={setVariables}
        handleVariableValueChange={handleVariableValueChange}
      />

      <ActionButtons
        handleCopyPrompt={handleCopyPrompt}
        handleSavePrompt={handleSavePrompt}
        handleRegenerate={handleRegenerate}
      />
    </StepThreeStyles>
  );
};
