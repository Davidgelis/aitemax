import { Edit, PlusCircle, Check, X, Lasso } from "lucide-react";
import { Variable, PromptJsonStructure } from "../types";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { 
  replaceVariableInPrompt, 
  convertEditedContentToPlaceholders,
  convertPlaceholdersToEditableFormat,
  convertPlaceholdersToSpans,
  toVariablePlaceholder
} from "@/utils/promptUtils";

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
  setIsEditing: (isEditing: boolean) => void;
  editablePrompt: string;
  setEditablePrompt: (prompt: string) => void;
  handleSaveEditedPrompt: () => void;
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
  handleSaveEditedPrompt
}: FinalPromptDisplayProps) => {
  
  const [processedPrompt, setProcessedPrompt] = useState("");
  const [promptJson, setPromptJson] = useState<PromptJsonStructure | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [jsonGenerated, setJsonGenerated] = useState(false);
  const [isCreatingVariable, setIsCreatingVariable] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLDivElement>(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [hasInitializedEditMode, setHasInitializedEditMode] = useState(false);
  
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    getUserId();
  }, []);
  
  // Filter to only get relevant variables
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  const convertPromptToJson = useCallback(async () => {
    if (!finalPrompt || finalPrompt.trim() === "" || jsonGenerated) return;
    
    setIsLoadingJson(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-to-json', {
        body: {
          prompt: finalPrompt,
          masterCommand,
          userId,
          promptId
        }
      });
      
      if (error) {
        throw new Error(`Error calling prompt-to-json: ${error.message}`);
      }
      
      if (data && data.jsonStructure) {
        setPromptJson(data.jsonStructure);
        setJsonGenerated(true);
        console.log("Prompt JSON structure generated:", data.jsonStructure);
      }
    } catch (error) {
      console.error("Error converting prompt to JSON:", error);
      toast({
        title: "Error generating JSON",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingJson(false);
    }
  }, [finalPrompt, masterCommand, toast, userId, promptId, jsonGenerated]);
  
  useEffect(() => {
    if (showJson && !jsonGenerated && !isLoadingJson) {
      convertPromptToJson();
    }
  }, [showJson, finalPrompt, convertPromptToJson, jsonGenerated, isLoadingJson]);
  
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
  
  // Modified edit mode initialization - use placeholder conversion
  useEffect(() => {
    if (isEditing && !hasInitializedEditMode) {
      // Process the prompt - convert placeholders to editable format
      const processedPrompt = convertPlaceholdersToEditableFormat(finalPrompt, relevantVariables);
      setEditablePrompt(processedPrompt);
      setHasInitializedEditMode(true);
    } else if (!isEditing && hasInitializedEditMode) {
      // Reset the initialization flag when exiting edit mode
      setHasInitializedEditMode(false);
    }
  }, [isEditing, finalPrompt, relevantVariables, hasInitializedEditMode, setEditablePrompt]);

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
    
    if (isMultiSelectMode) {
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
          title: "Selection added",
          description: `Added "${selText.substring(0, 20)}${selText.length > 20 ? '...' : ''}" to multi-selection`,
        });
      } catch (e) {
        console.error("Error highlighting multi-selection:", e);
        toast({
          title: "Selection error",
          description: "Could not select text. Try selecting a simpler text segment.",
          variant: "destructive"
        });
      }
      
      // Clear the selection
      selection.removeAllRanges();
    } else {
      // Single selection mode - legacy behavior
      setSelectedText(selText);
      
      // Create a temporary marker span (for positioning only)
      const tempSpan = document.createElement('span');
      tempSpan.setAttribute('id', 'temp-selection-marker');
      tempSpan.style.display = 'inline';
      
      try {
        // Remove any existing marker
        const existingMarker = document.getElementById('temp-selection-marker');
        if (existingMarker) {
          existingMarker.outerHTML = existingMarker.textContent || "";
        }
        
        range.surroundContents(tempSpan);
        
        // Position confirmation dialog near the marker
        const tempElement = document.getElementById('temp-selection-marker');
        if (tempElement) {
          const rect = tempElement.getBoundingClientRect();
          
          // Set position for the confirmation buttons
          setSelectionRange({
            start: rect.left,
            end: rect.top
          });
        }
      } catch (e) {
        console.error("Error highlighting selection:", e);
        toast({
          title: "Selection error",
          description: "Could not select text. Try selecting a simpler text segment.",
          variant: "destructive"
        });
        cancelVariableCreation();
        return;
      }
    }
  };
  
  const createMultiSelectionVariable = () => {
    if (multiSelections.length === 0) {
      toast({
        title: "No selections",
        description: "Please select at least one text segment first",
        variant: "destructive"
      });
      return;
    }
    
    if (relevantVariables.length >= 15) {
      toast({
        title: "Variable limit reached",
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
      value: combinedText, // Set the initial value to the combined selections
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
      title: "Multi-selection variable created",
      description: `Created variable: ${variableName} from ${multiSelections.length} selections`,
    });
    
    // Reset multi-selection mode
    exitMultiSelectionMode();
    cancelVariableCreation();
    setRenderTrigger(prev => prev + 1); // Force re-render
  };
  
  // Exit multi-selection mode and clean up
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
  
  const createVariableFromSelection = () => {
    if (!selectedText) return;
    
    if (relevantVariables.length >= 15) {
      toast({
        title: "Variable limit reached",
        description: "You can create up to 15 variables",
        variant: "destructive"
      });
      cancelVariableCreation();
      return;
    }
    
    // Use a simple numeric name based on the number of existing variables
    const variableName = `${relevantVariables.length + 1}`;
    const variableId = uuidv4();
    
    const newVariable: Variable = {
      id: variableId,
      name: variableName,
      value: selectedText, // Set the initial value to the selected text
      isRelevant: true,
      category: 'User-Defined'
    };
    
    // Record the original selection (for later replacement in the prompt)
    if (typeof recordVariableSelection === 'function') {
      recordVariableSelection(variableId, selectedText);
    }
    
    // Add the new variable to state
    setVariables(prev => [...prev, newVariable]);
    
    // Use the standardized placeholder format
    const varPlaceholder = toVariablePlaceholder(variableId);
    const updatedPrompt = replaceVariableInPrompt(finalPrompt, selectedText, varPlaceholder, variableName);
    updateFinalPrompt(updatedPrompt);
    
    toast({
      title: "Variable created",
      description: `Created variable: ${variableName}`,
    });
    
    cancelVariableCreation();
    setRenderTrigger(prev => prev + 1); // Force re-render
  };
  
  const cancelVariableCreation = () => {
    setIsCreatingVariable(false);
    setSelectedText("");
    setSelectionRange(null);
    
    // Remove temporary marker if it exists
    const tempElement = document.getElementById('temp-selection-marker');
    if (tempElement) {
      // Replace the span with its text content
      tempElement.outerHTML = tempElement.textContent || "";
    }
    
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
      setIsMultiSelectMode(false);
      toast({
        title: "Variable creation mode",
        description: "Select text to create a variable",
      });
    }
  };
  
  const toggleMultiSelectMode = () => {
    if (isEditing) return; // Don't allow multi-select while editing
    
    if (isMultiSelectMode) {
      exitMultiSelectionMode();
      setIsCreatingVariable(false);
    } else {
      setIsCreatingVariable(true);
      setIsMultiSelectMode(true);
      setMultiSelections([]);
      toast({
        title: "Multi-select mode",
        description: "Select multiple text segments to create a variable",
      });
    }
  };
  
  // Handle variable removal - replace placeholder with actual text
  const removeVariable = (variableId: string) => {
    // Find the variable we're removing
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;
    
    // Get the current value of the variable (to replace placeholder)
    const currentValue = variable.value || "";
    
    // Mark variable as not relevant
    setVariables(prev => 
      prev.map(v => 
        v.id === variableId ? { ...v, isRelevant: false } : v
      )
    );
    
    // Replace the placeholder with the actual text in the finalPrompt
    const varPlaceholder = toVariablePlaceholder(variableId);
    const updatedPrompt = finalPrompt.replace(new RegExp(varPlaceholder, 'g'), currentValue);
    updateFinalPrompt(updatedPrompt);
    
    toast({
      title: "Variable removed",
      description: "Variable has been removed",
    });
    
    setRenderTrigger(prev => prev + 1); // Force re-render
  };
  
  // For read-only rendering in the prompt display
  const renderVariablePlaceholder = (variable: Variable, uniqueKey: string) => {
    return (
      <span key={uniqueKey} className="inline-block relative variable-placeholder">
        <span className="variable-highlight px-1 py-0 m-0 bg-[#33fea6]/10 border-b border-[#33fea6] text-foreground font-medium min-w-16 inline-block">
          {variable.value || ""}
        </span>
      </span>
    );
  };

  // This function will be called when saving from edit mode
  const handleSaveFromEditMode = () => {
    if (editableContentRef.current) {
      // Get content directly from the DOM
      let newContent = editableContentRef.current.innerHTML;
      console.log("Raw content before processing:", newContent);
      
      // Convert the edited content back to the standardized placeholder format
      const processedContent = convertEditedContentToPlaceholders(newContent, relevantVariables);
      console.log("Processed content after conversion:", processedContent);
      
      // Update the final prompt with the processed content
      updateFinalPrompt(processedContent);
      setIsEditing(false);
      setEditablePrompt("");
      
      toast({
        title: "Changes saved",
        description: "Your prompt has been updated successfully.",
      });
      
      // Force a re-render to show the updated content with variables
      setRenderTrigger(prev => prev + 1);
    }
  };

  // Modified renderProcessedPrompt function to handle HTML parsing and variable placeholders
  const renderProcessedPrompt = () => {
    if (isEditing) {
      // In editing mode, create an uncontrolled editable div with special styling for variables
      let processedEditablePrompt = editablePrompt;
      
      // Replace {{value::id}} with visually distinct non-editable elements
      processedEditablePrompt = processedEditablePrompt.replace(
        /{{([^:}]*)::([\w-]+)}}/g,
        (match, value, variableId) => {
          const variable = relevantVariables.find(v => v.id === variableId);
          const displayValue = variable ? variable.value : value;
          return `<span contentEditable="false" class="non-editable-variable" data-variable-id="${variableId}">${displayValue}</span>`;
        }
      );
      
      return (
        <div className="h-full w-full">
          <div
            className="editing-mode w-full h-full min-h-[300px] p-4 rounded-md font-sans text-sm"
            contentEditable="true"
            suppressContentEditableWarning={true}
            ref={editableContentRef}
            dangerouslySetInnerHTML={{
              __html: processedEditablePrompt
            }}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              variant="outline" 
              className="edit-action-button edit-cancel-button"
              onClick={() => {
                setIsEditing(false);
                setEditablePrompt(""); // Clear the editable prompt on cancel
              }}
            >
              Cancel
            </Button>
            <Button 
              className="edit-action-button edit-save-button"
              onClick={handleSaveFromEditMode}
            >
              Save Changes
            </Button>
          </div>
        </div>
      );
    }
    
    if (showJson) {
      try {
        if (isLoadingJson) {
          return <div className="text-xs animate-pulse">Generating JSON structure...</div>;
        }
        
        if (promptJson) {
          return (
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(promptJson, null, 2)}
            </pre>
          );
        }
        
        return (
          <pre className="text-xs font-mono">
            {JSON.stringify({ 
              prompt: finalPrompt || "", 
              masterCommand: masterCommand || ""
            }, null, 2)}
          </pre>
        );
      } catch (error) {
        console.error("Error rendering JSON:", error);
        return <pre className="text-xs font-mono">Error rendering JSON</pre>;
      }
    }

    try {
      // Convert standardized placeholders to HTML spans for display
      const htmlContent = convertPlaceholdersToSpans(finalPrompt, relevantVariables);
      const paragraphs = htmlContent.split('\n\n');
      
      return (
        <div 
          className="prose prose-sm max-w-none" 
          ref={promptContainerRef}
          onMouseUp={handleMouseUp}
          key={`prompt-content-${renderTrigger}`}
        >
          {isCreatingVariable && selectionRange && selectedText ? (
            <div 
              className="fixed z-20 bg-white shadow-lg rounded-lg p-2 flex gap-2"
              style={{
                left: `${typeof selectionRange.start === 'number' ? selectionRange.start : 0}px`,
                top: `${typeof selectionRange.end === 'number' ? selectionRange.end + 20 : 0}px`,
              }}
            >
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" 
                onClick={createVariableFromSelection}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" 
                onClick={cancelVariableCreation}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          
          {paragraphs.map((paragraph, pIndex) => {
            if (!paragraph.trim()) return null;
            return <p key={`paragraph-${pIndex}`} dangerouslySetInnerHTML={{ __html: paragraph }} />;
          })}
        </div>
      );
    } catch (error) {
      console.error("Error rendering processed prompt:", error);
      return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
    }
  };

  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-4">
        {isMultiSelectMode && !isEditing && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-white shadow-lg rounded-lg p-2 flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 p-2 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" 
              onClick={createMultiSelectionVariable}
            >
              <Check className="h-4 w-4 mr-1" />
              Create Variable ({multiSelections.length})
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 hover:border-[#33fea6] hover:text-[#33fea6] hover:bg-white" 
              onClick={exitMultiSelectionMode}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {!isEditing && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-accent">Create Multi-Variable</span>
              <button 
                onClick={toggleMultiSelectMode}
                className={`p-2 rounded-full ${isMultiSelectMode ? 'bg-[#33fea6] text-white' : 'bg-white/80 hover:bg-white hover:text-[#33fea6]'} transition-colors`}
                aria-label={isMultiSelectMode ? "Exit multi-select mode" : "Multi-select mode"}
              >
                <Lasso className={`w-4 h-4 ${isMultiSelectMode ? 'text-white' : 'text-accent hover:text-[#33fea6]'}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-accent">Create Single-Variable</span>
              <button 
                onClick={toggleVariableCreation}
                className={`p-2 rounded-full ${isCreatingVariable && !isMultiSelectMode ? 'bg-[#33fea6] text-white' : 'bg-white/80 hover:bg-white hover:text-[#33fea6]'} transition-colors`}
                aria-label={isCreatingVariable && !isMultiSelectMode ? "Cancel creating variable" : "Create variable"}
              >
                <PlusCircle className={`w-4 h-4 ${isCreatingVariable && !isMultiSelectMode ? 'text-white' : 'text-accent hover:text-[#33fea6]'}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-accent">Edit Prompt</span>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full bg-white/80 hover:bg-white hover:text-[#33fea6] transition-colors"
                aria-label="Edit prompt text"
              >
                <Edit className="w-4 h-4 text-accent hover:text-[#33fea6]" />
              </button>
            </div>
          </>
        )}
      </div>
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className={`relative h-full p-6 overflow-y-auto ${isEditing ? 'editing-mode' : ''}`}>
        <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
        
        {renderProcessedPrompt()}
      </div>
    </div>
  );
};
