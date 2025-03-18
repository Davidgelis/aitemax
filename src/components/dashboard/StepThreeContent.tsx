
import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";

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
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  
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
  }, [externalHandleVariableValueChange, promptOperations, toast]);

  // Handle saving edited content from the FinalPromptDisplay
  const handleSaveInlineEdit = useCallback(() => {
    try {
      // When saving from inline edit, the editablePrompt should be processed
      // This happens within the FinalPromptDisplay component now
      setIsEditing(false);
      setEditablePrompt("");
      setRenderTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error saving edited prompt:", error);
      toast({
        title: "Error",
        description: "Could not save edited prompt. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

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
      promptOperations.removeVariable(variableId);
      toast({
        title: "Variable deleted",
        description: "The variable has been removed from your prompt",
      });
    }
  }, [promptOperations, toast]);

  const handleRefreshJson = useCallback(async () => {
    if (!finalPrompt) {
      toast({
        title: "No prompt to convert",
        description: "Please add content to your prompt first",
        variant: "destructive"
      });
      return;
    }

    setIsRefreshingJson(true);
    
    try {
      const processedPrompt = getProcessedPromptFunction();
      
      // Call the Supabase Edge Function to convert the prompt to JSON
      const { data, error } = await supabase.functions.invoke('prompt-to-json', {
        body: {
          prompt: processedPrompt,
          masterCommand,
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.jsonStructure) {
        setJsonData(data.jsonStructure);
        
        // Force a re-render to update the JSON view
        setRenderTrigger(prev => prev + 1);
        
        toast({
          title: "JSON Refreshed",
          description: "The JSON view has been updated with your latest changes",
        });
      }
    } catch (error) {
      console.error("Error refreshing JSON:", error);
      toast({
        title: "Error",
        description: "Could not refresh JSON. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingJson(false);
    }
  }, [finalPrompt, getProcessedPromptFunction, masterCommand, toast]);

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <ToggleSection 
        showJson={showJson}
        setShowJson={setShowJson}
        onRefreshJson={handleRefreshJson}
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
        jsonData={jsonData}
        isRefreshingJson={isRefreshingJson}
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
