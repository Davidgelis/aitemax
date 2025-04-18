import { Edit, PlusCircle, Check, X, Lasso } from "lucide-react";
import { Variable, PromptJsonStructure } from "../types";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { replaceVariableInPrompt, convertEditedContentToPlaceholders, convertPlaceholdersToEditableFormat, convertPlaceholdersToSpans, toVariablePlaceholder, stripHtml } from "@/utils/promptUtils";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";
interface FinalPromptDisplayProps {
  finalPrompt: string;
  updateFinalPrompt: (newPrompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection?: (variableId: string, selectedText: string) => void;
  isEditing: boolean;
  setIsEditing: (setIsEditing: boolean) => void;
  editablePrompt: string;
  setEditablePrompt: (prompt: string) => void;
  handleSaveEditedPrompt: () => void;
  renderTrigger?: number;
  setRenderTrigger: (callback: (prev: number) => number) => void;
  isRefreshing?: boolean;
  setIsRefreshing?: (isRefreshing: boolean) => void;
  lastSavedPrompt?: string;
  setLastSavedPrompt?: (prompt: string) => void;
}
export const FinalPromptDisplay = ({
  finalPrompt,
  updateFinalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
  showJson,
  masterCommand,
  handleOpenEditPrompt,
  recordVariableSelection,
  isEditing,
  setIsEditing,
  editablePrompt,
  setEditablePrompt,
  handleSaveEditedPrompt,
  renderTrigger = 0,
  setRenderTrigger,
  isRefreshing = false,
  setIsRefreshing,
  lastSavedPrompt = "",
  setLastSavedPrompt
}: FinalPromptDisplayProps) => {
  const [processedPrompt, setProcessedPrompt] = useState("");
  const [promptJson, setPromptJson] = useState<PromptJsonStructure | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [jsonGenerated, setJsonGenerated] = useState(false);
  const [isCreatingVariable, setIsCreatingVariable] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLDivElement>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [currentPromptHash, setCurrentPromptHash] = useState<string>("");
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  const {
    toast
  } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  useEffect(() => {
    const getUserId = async () => {
      const {
        data
      } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    getUserId();
  }, []);

  // Filter to only get relevant variables
  const relevantVariables = Array.isArray(variables) ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) : [];

  // Generate a clean text representation for the API
  const generateCleanTextForApi = useCallback(() => {
    try {
      // Get the processed HTML that includes all variable spans
      const processedHtml = getProcessedPrompt();

      // Create a temporary element to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = processedHtml;

      // Replace all variable spans with their text content
      const variableSpans = temp.querySelectorAll('[data-variable-id]');
      variableSpans.forEach(span => {
        const variableId = span.getAttribute('data-variable-id');
        const variable = relevantVariables.find(v => v.id === variableId);
        if (variable) {
          span.textContent = variable.value || '';
        }
      });

      // Get the text content (strips all HTML)
      let cleanText = temp.textContent || '';

      // Normalize whitespace
      cleanText = cleanText.replace(/\s+/g, ' ').trim();

      // Generate a simple hash to track if content has changed
      const simpleHash = btoa(cleanText.substring(0, 50) + cleanText.length);
      setCurrentPromptHash(simpleHash);
      console.log("Generated clean text for API, length:", cleanText.length);
      return cleanText;
    } catch (error) {
      console.error("Error generating clean text for API:", error);
      // Fallback: strip HTML directly from the processed prompt
      return stripHtml(getProcessedPrompt());
    }
  }, [getProcessedPrompt, relevantVariables]);

  // Modified convertPromptToJson to handle initial generation vs. refresh differently
  const convertPromptToJson = useCallback(async (forceRefresh = false) => {
    if (!finalPrompt || finalPrompt.trim() === "") {
      setJsonError("No prompt text to convert");
      return;
    }

    // Clear any existing error
    setJsonError(null);

    // Set loading state
    setIsLoadingJson(true);
    try {
      // Generate clean text for the API
      const cleanTextForApi = generateCleanTextForApi();
      if (!cleanTextForApi || cleanTextForApi.trim() === "") {
        throw new Error("Generated clean text is empty");
      }
      console.log("Sending to API:", {
        promptText: cleanTextForApi.substring(0, 100) + "...",
        length: cleanTextForApi.length
      });
      const requestBody: {
        prompt: string;
        masterCommand: string;
        userId: string | null;
        promptId: string | null;
        forceRefresh: boolean;
        existingStructure?: PromptJsonStructure;
      } = {
        prompt: cleanTextForApi,
        masterCommand,
        userId,
        promptId,
        forceRefresh // Only force refresh when explicitly requested
      };

      // If we're refreshing an existing JSON and have a previous structure, include it
      if (forceRefresh && promptJson) {
        requestBody.existingStructure = promptJson;
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('prompt-to-json', {
        body: requestBody
      });
      if (error) {
        throw new Error(`Error calling prompt-to-json: ${error.message}`);
      }
      if (data && data.jsonStructure) {
        // Remove timestamp if it exists
        if (data.jsonStructure.timestamp) {
          delete data.jsonStructure.timestamp;
        }
        setPromptJson(data.jsonStructure);
        setJsonGenerated(true);

        // Handle any generation errors in the response
        if (data.jsonStructure.generationError) {
          setJsonError(data.jsonStructure.generationError);
          toast({
            title: "JSON Generation Notice",
            description: data.jsonStructure.generationError,
            variant: "destructive"
          });
        } else {
          setJsonError(null);
          if (forceRefresh) {
            toast({
              title: "JSON Updated",
              description: "JSON structure has been refreshed with your changes"
            });
          } else {
            toast({
              title: "JSON Generated",
              description: "JSON structure has been created from your prompt"
            });
          }
        }
      }
    } catch (error) {
      console.error("Error converting prompt to JSON:", error);
      setJsonError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error generating JSON",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });

      // Set fallback JSON
      setPromptJson({
        title: "Error",
        summary: "Failed to process prompt",
        sections: [{
          title: "Content",
          content: "Could not generate JSON structure"
        }],
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoadingJson(false);
      if (setIsRefreshing) {
        setIsRefreshing(false);
      }

      // Force a re-render after JSON is updated
      setRenderTrigger(prev => prev + 1);
    }
  }, [finalPrompt, masterCommand, toast, userId, promptId, generateCleanTextForApi, setIsRefreshing, setRenderTrigger, promptJson]);

  // Handle JSON view toggling and initial generation
  useEffect(() => {
    if (showJson && !jsonGenerated && !isLoadingJson) {
      // Only generate from scratch on first toggle
      convertPromptToJson(false);
    }
  }, [showJson, jsonGenerated, isLoadingJson, convertPromptToJson]);

  // Handle render trigger changes for JSON refreshing
  useEffect(() => {
    if (renderTrigger > 0 && showJson && isRefreshing) {
      // Use forceRefresh:true to update existing structure
      convertPromptToJson(true);
    }
  }, [renderTrigger, showJson, isRefreshing, convertPromptToJson]);

  // Update processed prompt when props change
  useEffect(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        const result = getProcessedPrompt();
        setProcessedPrompt(result || "");
      }
    } catch (error) {
      console.error("Error processing prompt:", error);
      setProcessedPrompt(finalPrompt || "");
    }
  }, [getProcessedPrompt, finalPrompt, variables, renderTrigger]);

  // Initialize edit mode
  useEffect(() => {
    if (isEditing && editablePrompt === "") {
      const processedPrompt = convertPlaceholdersToEditableFormat(finalPrompt, relevantVariables);
      setEditablePrompt(processedPrompt);
    }
  }, [isEditing, finalPrompt, relevantVariables, editablePrompt, setEditablePrompt]);

  // Keep track of prompt changes to force JSON refresh
  useEffect(() => {
    // When finalPrompt changes and JSON view is active, mark JSON as needing refresh
    if (showJson && finalPrompt !== lastSavedPrompt) {
      if (jsonGenerated) {
        // If JSON was already generated, don't regenerate automatically
        // but allow manual refresh to update it
      } else {
        setJsonGenerated(false); // Force generation only if not already generated
      }
      if (setLastSavedPrompt) {
        setLastSavedPrompt(finalPrompt);
      }
    }
  }, [finalPrompt, showJson, lastSavedPrompt, setLastSavedPrompt, jsonGenerated]);
  const handleMouseUp = () => {
    if (!isCreatingVariable || isEditing) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    const container = promptContainerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    // Get the selected text
    const selText = selection.toString().trim();
    if (!selText) return;

    // Always use multi-selection mode
    // Add to multi-selections
    setMultiSelections(prev => [...prev, selText]);

    // Mark the selection with a temporary span
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('class', 'multi-selection-marker');
    tempSpan.style.backgroundColor = 'rgba(51, 254, 166, 0.3)';
    try {
      range.surroundContents(tempSpan);

      // Show a toast to indicate the selection was added
      toast({
        title: t.steps.variableActions.selectionAdded,
        description: `Added "${selText.substring(0, 20)}${selText.length > 20 ? '...' : ''}" to multi-selection`
      });
    } catch (e) {
      console.error("Error highlighting multi-selection:", e);
      toast({
        title: t.steps.variableActions.selectionError,
        description: "Could not select text. Try selecting a simpler text segment.",
        variant: "destructive"
      });
    }

    // Clear the selection
    selection.removeAllRanges();
  };
  const createMultiSelectionVariable = () => {
    if (multiSelections.length === 0) {
      toast({
        title: t.steps.variableActions.noSelection,
        description: "Please select at least one text segment first",
        variant: "destructive"
      });
      return;
    }
    if (relevantVariables.length >= 15) {
      toast({
        title: t.steps.variableActions.limitReached,
        description: "You can create up to 15 variables",
        variant: "destructive"
      });
      cancelVariableCreation();
      return;
    }

    // Join all selections with a space for the variable value
    const combinedText = multiSelections.join(" ");

    // Use a simple numeric name based on the number of existing variables
    const variableName = `${relevantVariables.length + 1}`;
    const variableId = uuidv4();
    const newVariable: Variable = {
      id: variableId,
      name: variableName,
      value: combinedText,
      // Set the initial value to the combined selections
      isRelevant: true,
      category: 'Multi-Select'
    };

    // Record the original selection (for later replacement in the prompt)
    if (typeof recordVariableSelection === 'function') {
      recordVariableSelection(variableId, combinedText);
    }

    // Add the new variable to state
    setVariables(prev => [...prev, newVariable]);

    // Create a copy of the prompt to work with
    let updatedPrompt = finalPrompt;

    // Replace each selection with a standardized placeholder
    multiSelections.forEach(selection => {
      const varPlaceholder = toVariablePlaceholder(variableId);
      updatedPrompt = replaceVariableInPrompt(updatedPrompt, selection, varPlaceholder, variableName);
    });

    // Update the prompt
    updateFinalPrompt(updatedPrompt);
    toast({
      title: t.steps.variableActions.created,
      description: `Created variable: ${variableName} from ${multiSelections.length} selections`
    });

    // Reset multi-selection mode
    exitMultiSelectionMode();
    cancelVariableCreation();

    // Force re-render
    setRenderTrigger(prev => prev + 1);

    // Reset JSON generation to force refresh if needed
    if (showJson) {
      setJsonGenerated(false);
    }
  };
  const exitMultiSelectionMode = () => {
    // Remove all temporary multi-selection markers
    const markers = document.querySelectorAll('.multi-selection-marker');
    markers.forEach(marker => {
      if (marker instanceof HTMLElement) {
        marker.outerHTML = marker.textContent || "";
      }
    });
    setMultiSelections([]);
    setIsMultiSelectMode(false);
  };
  const cancelVariableCreation = () => {
    setIsCreatingVariable(false);
    setMultiSelections([]);

    // Also exit multi-selection mode if active
    if (isMultiSelectMode) {
      exitMultiSelectionMode();
    }
    window.getSelection()?.removeAllRanges();
  };
  const toggleVariableCreation = () => {
    if (isEditing) return; // Don't allow variable creation while editing

    if (isCreatingVariable) {
      cancelVariableCreation();
    } else {
      setIsCreatingVariable(true);
      setIsMultiSelectMode(true);
      setMultiSelections([]);
      toast({
        title: t.steps.toggleSections.createVariableMode,
        description: "Select text segments to create a variable"
      });
    }
  };
  const removeVariable = (variableId: string) => {
    // Find the variable we're removing
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;

    // Get the current value of the variable (to replace placeholder)
    const currentValue = variable.value || "";

    // Mark variable as not relevant
    setVariables(prev => prev.map(v => v.id === variableId ? {
      ...v,
      isRelevant: false
    } : v));

    // Replace the placeholder with the actual text in the finalPrompt
    const varPlaceholder = toVariablePlaceholder(variableId);
    const updatedPrompt = finalPrompt.replace(new RegExp(varPlaceholder, 'g'), currentValue);
    updateFinalPrompt(updatedPrompt);
    toast({
      title: t.steps.variableActions.deleted,
      description: "Variable has been removed"
    });

    // Force re-render and reset JSON if needed
    setRenderTrigger(prev => prev + 1);
    if (showJson) {
      setJsonGenerated(false);
    }
  };
  const renderVariablePlaceholder = (variable: Variable, uniqueKey: string) => {
    return <span key={uniqueKey} className="inline-block relative variable-placeholder">
        <span className="variable-highlight px-1 py-0 m-0 bg-[#33fea6]/10 border-b border-[#33fea6] text-foreground font-medium min-w-16 inline-block">
          {variable.value || ""}
        </span>
      </span>;
  };

  // This function will be called when saving from edit mode
  const handleSaveFromEditMode = () => {
    if (editableContentRef.current) {
      // Get content directly from the DOM
      let newContent = editableContentRef.current.innerHTML;

      // Convert the edited content back to the standardized placeholder format
      const processedContent = convertEditedContentToPlaceholders(newContent, relevantVariables);

      // Update the final prompt with the processed content
      updateFinalPrompt(processedContent);
      setIsEditing(false);
      setEditablePrompt("");
      toast({
        title: t.steps.promptActions.changesSaved,
        description: "Your prompt has been updated successfully."
      });

      // Mark JSON as needing manual refresh but don't reset jsonGenerated flag
      if (setLastSavedPrompt) {
        setLastSavedPrompt(processedContent);
      }

      // Force a re-render to show the updated content with variables
      setRenderTrigger(prev => prev + 1);

      // Don't automatically refresh JSON - wait for manual refresh
    }
  };

  // Modified renderProcessedPrompt function to handle HTML parsing and variable placeholders
  const renderProcessedPrompt = () => {
    if (isEditing) {
      // In editing mode, create an uncontrolled editable div with special styling for variables
      let processedEditablePrompt = editablePrompt;

      // Replace {{value::id}} with visually distinct non-editable elements
      processedEditablePrompt = processedEditablePrompt.replace(/{{([^:}]*)::([\w-]+)}}/g, (match, value, variableId) => {
        const variable = relevantVariables.find(v => v.id === variableId);
        const displayValue = variable ? variable.value : value;
        return `<span contentEditable="false" class="non-editable-variable" data-variable-id="${variableId}">${displayValue}</span>`;
      });
      return <div className="h-full w-full">
          <div className="editing-mode w-full h-full min-h-[300px] p-4 rounded-md font-sans text-sm" contentEditable="true" suppressContentEditableWarning={true} ref={editableContentRef} dangerouslySetInnerHTML={{
          __html: processedEditablePrompt
        }} />
          <div className="flex justify-end space-x-2 mt-2">
            <Button variant="outline" className="edit-action-button edit-cancel-button" onClick={() => {
            setIsEditing(false);
            setEditablePrompt(""); // Clear the editable prompt on cancel
          }}>
              {t.steps.promptActions.cancel}
            </Button>
            <Button className="edit-action-button edit-save-button" onClick={handleSaveFromEditMode}>
              {t.steps.promptActions.saveChanges}
            </Button>
          </div>
        </div>;
    }
    if (showJson) {
      if (isLoadingJson || isRefreshing) {
        return <div className="text-xs flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="mb-2 text-accent">{t.steps.toggleSections.jsonLoadingTitle}</div>
              <div className="text-xs text-muted-foreground">{t.steps.toggleSections.jsonLoadingSubtitle}</div>
            </div>
          </div>;
      }
      if (jsonError) {
        return <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="text-xs text-destructive mb-2">{t.steps.toggleSections.jsonError} {jsonError}</div>
            <Button variant="outline" size="sm" onClick={() => convertPromptToJson(true)} className="mt-2">
              {t.steps.toggleSections.tryAgain}
            </Button>
          </div>;
      }
      if (promptJson) {
        return <pre className="text-xs font-mono overflow-x-auto">
            {JSON.stringify(promptJson, null, 2)}
          </pre>;
      }
      return <pre className="text-xs font-mono">
          {JSON.stringify({
          prompt: finalPrompt || "",
          masterCommand: masterCommand || ""
        }, null, 2)}
        </pre>;
    }
    try {
      // Convert standardized placeholders to HTML spans for display
      const htmlContent = convertPlaceholdersToSpans(finalPrompt, relevantVariables);
      const paragraphs = htmlContent.split('\n\n');
      return <div className="prose prose-sm max-w-none" ref={promptContainerRef} onMouseUp={handleMouseUp} key={`prompt-content-${renderTrigger}`}>
          {isCreatingVariable && multiSelections.length > 0 && <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-white shadow-lg rounded-lg p-2 flex gap-2">
              <Button size="sm" variant="outline" className="h-8 p-2 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" onClick={createMultiSelectionVariable}>
                <Check className="h-4 w-4 mr-1" />
                {t.steps.toggleSections.variableCount} ({multiSelections.length})
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" onClick={cancelVariableCreation}>
                <X className="h-4 w-4" />
              </Button>
            </div>}
          
          {paragraphs.map((paragraph, pIndex) => {
          if (!paragraph.trim()) return null;
          return <p key={`paragraph-${pIndex}`} dangerouslySetInnerHTML={{
            __html: paragraph
          }} />;
        })}
        </div>;
    } catch (error) {
      console.error("Error rendering processed prompt:", error);
      return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
    }
  };
  return <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-4">
        {!isEditing && <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-accent">{t.steps.toggleSections.createVariable}</span>
              <button onClick={toggleVariableCreation} className={`p-2 rounded-full ${isCreatingVariable ? 'bg-[#33fea6] text-white' : 'bg-white/80 hover:bg-white hover:text-[#33fea6]'} transition-colors`} aria-label={isCreatingVariable ? t.steps.toggleSections.exitVariableMode : t.steps.toggleSections.createVariableMode}>
                <PlusCircle className={`w-4 h-4 ${isCreatingVariable ? 'text-white' : 'text-accent hover:text-[#33fea6]'}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-accent">{t.steps.toggleSections.editPrompt}</span>
              <button onClick={() => setIsEditing(true)} className="p-2 rounded-full bg-white/80 hover:bg-white hover:text-[#33fea6] transition-colors" aria-label={t.steps.toggleSections.editPrompt}>
                <Edit className="w-4 h-4 text-accent hover:text-[#33fea6]" />
              </button>
            </div>
          </>}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10" style={{
      backgroundSize: "400% 400%"
    }} />
      
      <div className={`relative h-full p-6 ${isEditing ? 'editing-mode' : ''}`}>
        <h3 className="text-lg text-accent font-medium mb-2">{t.steps.toggleSections.finalPromptTitle}</h3>
        
        <div className="h-[calc(100%-3rem)] overflow-auto prompt-content-container">
          {renderProcessedPrompt()}
        </div>
      </div>
    </div>;
};
