import React, { useState, useEffect } from "react";
import { FinalPromptDisplay } from "@/components/dashboard/step-three/FinalPromptDisplay";
import { MasterCommandSection } from "@/components/dashboard/step-three/MasterCommandSection";
import { ToggleSection } from "@/components/dashboard/step-three/ToggleSection";
import { VariablesSection } from "@/components/dashboard/step-three/VariablesSection";
import { ActionButtons } from "@/components/dashboard/step-three/ActionButtons";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";
import { Switch } from "@/components/ui/switch";

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
  handleVariableValueChange: (id: string, value: string) => void;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  isPrivate?: boolean;
  setIsPrivate?: (isPrivate: boolean) => void;
}

export const StepThreeContent: React.FC<StepThreeContentProps> = ({
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
  isPrivate = false,
  setIsPrivate = () => {}
}) => {
  const [isCopied, setCopied] = useState(false);
  const {
    isMobile,
    isTablet,
    isDesktop
  } = useResponsive();
  const {
    toast
  } = useToast();
  const [value, copy] = useCopyToClipboard();
  const handleCopy = () => {
    copy(finalPrompt);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  return (
    <div className="w-full space-y-6">
      <MasterCommandSection 
        masterCommand={masterCommand}
        setMasterCommand={setMasterCommand}
      />
      
      <ToggleSection 
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        handlePrimaryToggle={handlePrimaryToggle}
        handleSecondaryToggle={handleSecondaryToggle}
      />
      
      <VariablesSection 
        variables={variables}
        setVariables={setVariables}
        handleVariableValueChange={handleVariableValueChange}
      />
      
      <FinalPromptDisplay
        finalPrompt={finalPrompt}
        updateFinalPrompt={setFinalPrompt}
        getProcessedPrompt={getProcessedPrompt}
        variables={variables}
        setVariables={setVariables}
        showJson={showJson}
        masterCommand={masterCommand}
        handleOpenEditPrompt={handleOpenEditPrompt}
        isEditing={false}
        setIsEditing={() => {}}
        editablePrompt={editingPrompt}
        setEditablePrompt={setEditingPrompt}
        handleSaveEditedPrompt={handleSaveEditedPrompt}
      />
      
      <ActionButtons
        onCopyPrompt={handleCopyPrompt}
        onSavePrompt={handleSavePrompt}
        onRegenerate={handleRegenerate}
        isPrivate={isPrivate}
        setIsPrivate={setIsPrivate}
      />
    </div>
  );
};
