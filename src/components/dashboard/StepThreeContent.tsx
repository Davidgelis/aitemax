
import { useState, useEffect, useCallback, useRef } from "react";
import { Variable } from "./types";
import { ToggleSection } from "./step-three/ToggleSection";
import { FinalPromptDisplay } from "./step-three/FinalPromptDisplay";
import { VariablesSection } from "./step-three/VariablesSection";
import { ActionButtons } from "./step-three/ActionButtons";
import { StepThreeStyles } from "./step-three/StepThreeStyles";
import { useToast } from "@/hooks/use-toast";
import { usePromptOperations } from "@/hooks/usePromptOperations";
import { 
  convertEditedContentToPlaceholders, 
  convertPlaceholdersToSpans 
} from "@/utils/promptUtils";
import { UploadedImageList } from "./step-three/UploadedImageList";

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
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [lastSavedPrompt, setLastSavedPrompt] = useState(finalPrompt);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [tempVariableToDelete, setTempVariableToDelete] = useState<string | null>(null);
  
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
  }, [externalHandleVariableValueChange, promptOperations, toast]);

  // Handle saving edited content from the FinalPromptDisplay
  const handleSaveInlineEdit = useCallback(() => {
    try {
      setIsEditing(false);
      setEditablePrompt("");
      setRenderTrigger(prev => prev + 1);
      
      // Only manually refresh JSON if already showing
      if (showJson) {
        handleRefreshJson();
      }
    } catch (error) {
      console.error("Error saving edited prompt:", error);
      toast({
        title: "Error",
        description: "Could not save edited prompt. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, showJson]);

  const getProcessedPromptFunction = useCallback(() => {
    if (typeof externalGetProcessedPrompt === 'function') {
      return externalGetProcessedPrompt();
    }
    return promptOperations.getProcessedPrompt();
  }, [externalGetProcessedPrompt, promptOperations]);

  const recordVariableSelection = useCallback((variableId: string, selectedText: string) => {
    console.log("Recording variable selection:", variableId, selectedText);
    promptOperations.recordVariableSelection(variableId, selectedText);
  }, [promptOperations]);
  
  const handleDeleteVariable = useCallback((variableId: string) => {
    if (promptOperations.removeVariable) {
      setTempVariableToDelete(variableId);
      promptOperations.removeVariable(variableId);
      toast({
        title: "Variable deleted",
        description: "The variable has been removed from your prompt",
      });
    }
  }, [promptOperations, toast]);

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

  // Show the uploaded images if there are any
  const renderUploadedImages = () => {
    if (uploadedImages && uploadedImages.length > 0) {
      return (
        <UploadedImageList images={uploadedImages} onRemove={(id) => {
          setUploadedImages(uploadedImages.filter(img => img.id !== id));
        }} />
      );
    }
    return null;
  };

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
        refreshJson={handleRefreshJson}
        isRefreshing={isRefreshingJson}
      />

      {/* Pass proper props to FinalPromptDisplay */}
      <div className="flex-1 overflow-auto">
        <FinalPromptDisplay 
          finalPrompt={finalPrompt}
          updateFinalPrompt={setFinalPrompt}
          getProcessedPrompt={getProcessedPromptFunction}
          variables={safeVariables}
          setVariables={setVariables}
          showJson={showJson}
          masterCommand={masterCommand}
          handleOpenEditPrompt={externalHandleOpenEditPrompt || (() => {})}
          recordVariableSelection={recordVariableSelection}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editablePrompt={editablePrompt}
          setEditablePrompt={setEditablePrompt}
          handleSaveEditedPrompt={handleSaveInlineEdit}
          renderTrigger={renderTrigger}
          setRenderTrigger={setRenderTrigger}
          isRefreshing={isRefreshingJson}
          setIsRefreshing={setIsRefreshingJson}
          lastSavedPrompt={lastSavedPrompt}
          setLastSavedPrompt={setLastSavedPrompt}
          tempVariableToDelete={tempVariableToDelete}
        />
      </div>

      {renderUploadedImages()}

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
