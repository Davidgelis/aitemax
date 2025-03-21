import { useState, useEffect, useRef, useCallback } from "react";
import { Variable } from "../types";
import { Edit, X, Check } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
  renderTrigger: number;
  setRenderTrigger: (trigger: number) => void;
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  lastSavedPrompt: string;
  setLastSavedPrompt: (prompt: string) => void;
  isMultiSelectMode?: boolean;
  toggleMultiSelectMode?: () => void;
  handleMultiSelection?: (text: string, range: Range) => void;
  multiSelections?: Array<{text: string, range: Range}>;
  setMultiSelections?: React.Dispatch<React.SetStateAction<Array<{text: string, range: Range}>>>;
  createCombinedVariable?: () => void;
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
  renderTrigger,
  setRenderTrigger,
  isRefreshing,
  setIsRefreshing,
  lastSavedPrompt,
  setLastSavedPrompt,
  isMultiSelectMode = false,
  toggleMultiSelectMode = () => {},
  handleMultiSelection = () => {},
  multiSelections = [],
  setMultiSelections = () => {},
  createCombinedVariable = () => {}
}: FinalPromptDisplayProps) => {
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [showCreateVariablePopup, setShowCreateVariablePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [processedContent, setProcessedContent] = useState("");
  const [isCreatingVariable, setIsCreatingVariable] = useState(false);
  
  // Update processed content when necessary
  useEffect(() => {
    if (!showJson) {
      const processed = getProcessedPrompt();
      setProcessedContent(processed);
    }
  }, [finalPrompt, variables, getProcessedPrompt, showJson, renderTrigger]);
  
  // Monitor text selection in the prompt display
  useEffect(() => {
    const handleSelectionChange = () => {
      if (isEditing || showJson) return;
      
      const selection = window.getSelection();
      
      if (selection && selection.toString().trim() && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const promptContainer = promptContainerRef.current;
        
        // Check if selection is within our container
        if (promptContainer && promptContainer.contains(range.commonAncestorContainer)) {
          const selectedContent = selection.toString().trim();
          const rangeRect = range.getBoundingClientRect();
          
          // Calculate popup position for variable creation
          const containerRect = promptContainer.getBoundingClientRect();
          const top = rangeRect.bottom - containerRect.top;
          const left = rangeRect.left + (rangeRect.width / 2) - containerRect.left;
          
          setSelectedText(selectedContent);
          setSelectionRange(range.cloneRange());
          setPopupPosition({ top, left });
          
          // In multi-select mode, add the selection and don't show popup
          if (isMultiSelectMode) {
            handleMultiSelection(selectedContent, range.cloneRange());
            setShowCreateVariablePopup(false);
          } else {
            setShowCreateVariablePopup(true);
          }
        }
      } else {
        // Only hide popup in regular mode - in multi-select we keep it visible
        if (!isMultiSelectMode) {
          setShowCreateVariablePopup(false);
        }
      }
    };
    
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isEditing, showJson, isMultiSelectMode, handleMultiSelection]);
  
  // Start editing mode with the current content
  const startEditing = useCallback(() => {
    // Hide any popups
    setShowCreateVariablePopup(false);
    setIsEditing(true);
    setEditablePrompt(finalPrompt);
  }, [finalPrompt, setIsEditing, setEditablePrompt]);
  
  // Cancel editing and revert to last saved state
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditablePrompt("");
  }, [setIsEditing, setEditablePrompt]);
  
  // Create a new variable from selected text
  const createVariable = useCallback(() => {
    if (!selectedText || !selectionRange) return;
    
    try {
      setIsCreatingVariable(true);
      
      // Create a new variable with a unique ID
      const variableId = uuidv4();
      const variableName = `Variable ${variables.filter(v => v.isRelevant).length + 1}`;
      
      // Store the range for highlighting
      if (recordVariableSelection) {
        recordVariableSelection(variableId, selectedText);
      }
      
      // Get the HTML context where the selection appears
      // This helps with precise replacement in rich text
      const range = selectionRange;
      const parent = range.commonAncestorContainer;
      
      // Create placeholder for the variable
      const placeholder = `{{value::${variableId}}}`;
      
      // Replace the selected text with the placeholder in the prompt
      let updatedPrompt = finalPrompt;
      
      // Simple replace (works for plain text)
      updatedPrompt = updatedPrompt.replace(selectedText, placeholder);
      
      // Add the new variable to the variables array
      const newVariable: Variable = {
        id: variableId,
        name: variableName,
        value: selectedText,
        isRelevant: true,
        category: "Other"
      };
      
      setVariables(prev => [...prev, newVariable]);
      updateFinalPrompt(updatedPrompt);
      
      // Clear selection state
      setShowCreateVariablePopup(false);
      setSelectedText("");
      setSelectionRange(null);
      
      // Force re-render the prompt with updated variables
      setRenderTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error creating variable:", error);
    } finally {
      setIsCreatingVariable(false);
    }
  }, [selectedText, selectionRange, finalPrompt, variables, setVariables, updateFinalPrompt, setRenderTrigger, recordVariableSelection]);
  
  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {!isEditing ? (
          <>
            {/* Add Multi-Select Mode Toggle */}
            <div className="flex items-center mr-2 bg-white px-2 py-1 rounded-md shadow-sm">
              <span className="text-xs mr-2">Multi-select mode</span>
              <Switch
                checked={isMultiSelectMode}
                onCheckedChange={toggleMultiSelectMode}
                className="scale-75"
              />
            </div>
            
            <button 
              onClick={startEditing}
              className="p-2 rounded-full bg-white edit-icon-button"
              title="Edit prompt"
            >
              <Edit className="w-4 h-4 text-accent edit-icon" />
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={cancelEditing}
              className="p-2 rounded-full bg-white edit-icon-button"
              title="Cancel editing"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
            <button 
              onClick={handleSaveEditedPrompt}
              className="p-2 rounded-full bg-white edit-icon-button"
              title="Save changes"
            >
              <Check className="w-4 h-4 text-[#33fea6]" />
            </button>
          </div>
        )}
      </div>
      
      {/* Create Variable popup */}
      {showCreateVariablePopup && !isEditing && !isMultiSelectMode && (
        <div
          className="absolute z-10 shadow-lg rounded-md bg-white flex"
          style={{
            top: `${popupPosition.top + 10}px`,
            left: `${popupPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={createVariable}
            disabled={isCreatingVariable}
            className="edit-action-button edit-save-button m-1"
          >
            Create Variable
          </button>
        </div>
      )}
      
      {/* Multi-select UI */}
      {isMultiSelectMode && (
        <div className="absolute top-14 right-2 z-10 bg-white rounded-md shadow-md p-2 flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-2">
            {multiSelections.length} text {multiSelections.length === 1 ? 'portion' : 'portions'} selected
          </div>
          <button
            onClick={() => setMultiSelections([])}
            className="text-xs text-red-500 hover:underline mb-2"
          >
            Clear selections
          </button>
          {multiSelections.length > 0 && (
            <button
              onClick={createCombinedVariable}
              className="create-all-button"
            >
              Create Variable
            </button>
          )}
        </div>
      )}
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className={`relative h-full p-6 overflow-y-auto ${isEditing ? 'editing-mode' : ''} ${isMultiSelectMode ? 'multi-selection-active' : ''}`}>
        <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
        
        {isEditing ? (
          <textarea
            value={editablePrompt}
            onChange={(e) => setEditablePrompt(e.target.value)}
            className="w-full h-[calc(100%-3rem)] resize-none border-none focus:outline-none focus:ring-0 text-card-foreground"
          />
        ) : (
          <div 
            ref={promptContainerRef} 
            className="whitespace-pre-wrap text-card-foreground"
          >
            {showJson ? (
              <pre className="text-xs font-mono">
                {JSON.stringify({ 
                  prompt: finalPrompt, 
                  masterCommand,
                  variables: variables.filter(v => v.isRelevant === true)
                }, null, 2)}
              </pre>
            ) : (
              <div className="prose prose-sm max-w-none relative">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: processedContent.split('\n\n').map(p => `<p>${p}</p>`).join('') 
                  }} 
                />
                
                {/* Highlight multi-selections */}
                {isMultiSelectMode && multiSelections.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* This is where we'd render highlights for multi-selections, 
                        but it would require complex DOM manipulation */}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
