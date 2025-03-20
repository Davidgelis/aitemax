
import { useState, useEffect, useCallback, useRef } from "react";
import { Variable } from "./types";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { ActionButtons } from "./step-three/ActionButtons";
import { StepThreeStyles } from "./step-three/StepThreeStyles";
import { useToast } from "@/hooks/use-toast";
import { usePromptOperations } from "@/hooks/usePromptOperations";
import { 
  convertEditedContentToPlaceholders, 
  convertPlaceholdersToSpans 
} from "@/utils/promptUtils";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState("");
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [lastSavedPrompt, setLastSavedPrompt] = useState(finalPrompt);
  
  // Get the promptOperations
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
  
  useEffect(() => {
    setRenderTrigger(prev => prev + 1);
  }, [variables]);
  
  // Update lastSavedPrompt when finalPrompt changes
  useEffect(() => {
    setLastSavedPrompt(finalPrompt);
  }, [finalPrompt]);
  
  const getProcessedPromptFunction = useCallback(() => {
    if (typeof externalGetProcessedPrompt === 'function') {
      return externalGetProcessedPrompt();
    }
    return promptOperations.getProcessedPrompt();
  }, [externalGetProcessedPrompt, promptOperations]);

  // Improved handleRefreshJson function to use the latest finalPrompt
  const handleRefreshJson = useCallback(() => {
    if (isRefreshingJson) return;
    
    setIsRefreshingJson(true);
    toast({
      title: "Refreshing JSON",
      description: "Updating JSON structure with current content...",
    });
    
    // Force re-render of the JSON view with latest content
    setTimeout(() => {
      setRenderTrigger(prev => prev + 1);
      setIsRefreshingJson(false);
    }, 100);
  }, [toast, isRefreshingJson]);

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
        refreshJson={handleRefreshJson}
        isRefreshing={isRefreshingJson}
      />

      <FinalPromptDisplay 
        finalPrompt={finalPrompt || ""}
        updateFinalPrompt={setFinalPrompt}
        getProcessedPrompt={getProcessedPromptFunction}
        variables={variables}
        setVariables={setVariables}
        showJson={showJson}
        masterCommand={masterCommand || ""}
        handleOpenEditPrompt={externalHandleOpenEditPrompt}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editablePrompt={editablePrompt}
        setEditablePrompt={setEditablePrompt}
        handleSaveEditedPrompt={externalHandleSaveEditedPrompt} // Fix: Pass the missing prop
        renderTrigger={renderTrigger}
        setRenderTrigger={setRenderTrigger}
        isRefreshing={isRefreshingJson}
        setIsRefreshing={setIsRefreshingJson}
        lastSavedPrompt={lastSavedPrompt}
        setLastSavedPrompt={setLastSavedPrompt}
      />

      <ActionButtons 
        handleCopyPrompt={externalHandleCopyPrompt}
        handleSavePrompt={handleSavePrompt}
      />

      <StepThreeStyles />
    </div>
  );
};
