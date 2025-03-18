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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jsonRequestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const [refreshJsonTrigger, setRefreshJsonTrigger] = useState(0);
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const MIN_REFRESH_INTERVAL = 3000; // 3 seconds between refreshes (reduced from 5s for better UX)
  
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

  // Improved handleRefreshJson with better error handling and user feedback
  const handleRefreshJson = useCallback(() => {
    const now = Date.now();
    
    // Clear any pending request timeout
    if (jsonRequestTimeoutRef.current) {
      clearTimeout(jsonRequestTimeoutRef.current);
      jsonRequestTimeoutRef.current = null;
    }
    
    if (isRefreshingJson) {
      console.log("Already refreshing JSON, ignoring request");
      toast({
        title: "Please wait",
        description: "JSON refresh already in progress",
      });
      return; // Prevent multiple refreshes at once
    }
    
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      console.log(`Throttling JSON refresh request (last refresh was ${now - lastRefreshTime}ms ago)`);
      toast({
        title: "Please wait",
        description: `Please wait ${Math.ceil((MIN_REFRESH_INTERVAL - (now - lastRefreshTime)) / 1000)} seconds before refreshing again`,
      });
      return; // Rate limiting on client side
    }
    
    // Set state first before proceeding
    setIsRefreshingJson(true);
    setLastRefreshTime(now);
    
    // Show toast message immediately for better UX
    toast({
      title: "Refreshing JSON",
      description: "Generating updated JSON structure...",
    });
    
    // Trigger refresh with a small delay
    jsonRequestTimeoutRef.current = setTimeout(() => {
      // Increment the trigger to cause the effect in FinalPromptDisplay to run
      setRefreshJsonTrigger(prev => prev + 1);
      jsonRequestTimeoutRef.current = null;
    }, 100); // Small delay for better UX
    
    // Set a failsafe timeout to reset the state if something goes wrong
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (isRefreshingJson) {
        setIsRefreshingJson(false);
        refreshTimeoutRef.current = null;
        
        toast({
          title: "JSON refresh timed out",
          description: "The refresh operation took too long. Please try again.",
          variant: "destructive"
        });
      }
    }, 15000); // 15 second timeout as a failsafe
  }, [toast, isRefreshingJson, lastRefreshTime]);
  
  // Listen for JSON generation completion to reset the refreshing state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsRefreshingJson(false);
    }, 3000); // Reset after 3 seconds to ensure UI isn't stuck
    
    return () => clearTimeout(timeoutId);
  }, [refreshJsonTrigger]);
  
  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (jsonRequestTimeoutRef.current) {
        clearTimeout(jsonRequestTimeoutRef.current);
      }
    };
  }, []);

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
        refreshJsonTrigger={refreshJsonTrigger}
        setIsRefreshingJson={setIsRefreshingJson}
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
