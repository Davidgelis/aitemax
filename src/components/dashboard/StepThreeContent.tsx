
import React from 'react';
import { StepThreeStyles } from './step-three/StepThreeStyles';
import { FinalPromptDisplay } from './step-three/FinalPromptDisplay';
import { Variable } from './types';
import { MasterCommandSection } from './step-three/MasterCommandSection';
import { VariablesSection } from './step-three/VariablesSection';
import { ToggleSection } from './step-three/ToggleSection';
import { ActionButtons } from './step-three/ActionButtons';
import { primaryToggles, secondaryToggles } from './constants';

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
  editingPrompt: string;
  setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: React.Dispatch<React.SetStateAction<boolean>>;
  handleSavePrompt: () => void;
  handleCopyPrompt: () => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleRegenerate: () => void;
  handleAdaptPrompt: () => void;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  handleVariableValueChange: (id: string, value: string) => void;
  getProcessedPrompt: () => string;
  onCreateVariable?: (selectedText: string) => void;
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
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleSavePrompt,
  handleCopyPrompt,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  variables,
  setVariables,
  handleVariableValueChange,
  handleRegenerate,
  handleAdaptPrompt,
  getProcessedPrompt,
  onCreateVariable
}: StepThreeContentProps) => {
  return (
    <StepThreeStyles>
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
