
import { useState, useEffect, useRef, useCallback } from "react";
import { Variable } from "../types";
import { Edit, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  selectedText: string;
  setSelectedText: (text: string) => void;
  onCreateVariable: (text: string) => void;
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
  selectedText,
  setSelectedText,
  onCreateVariable
}: FinalPromptDisplayProps) => {
  const promptContainerRef = useRef<HTMLDivElement>(null);
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
          setShowCreateVariablePopup(true);
        }
      } else {
        setShowCreateVariablePopup(false);
      }
    };
    
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isEditing, showJson, setSelectedText]);
  
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
    if (!selectedText) return;
    
    try {
      setIsCreatingVariable(true);
      
      onCreateVariable(selectedText);
      
      // Clear selection state
      setShowCreateVariablePopup(false);
      setSelectedText("");
      setSelectionRange(null);
      
    } catch (error) {
      console.error("Error creating variable:", error);
    } finally {
      setIsCreatingVariable(false);
    }
  }, [selectedText, onCreateVariable, setSelectedText]);
  
  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10">
        {!isEditing ? (
          <button 
            onClick={startEditing}
            className="p-2 rounded-full bg-white edit-icon-button"
            title="Edit prompt"
          >
            <Edit className="w-4 h-4 text-accent edit-icon" />
          </button>
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
      {showCreateVariablePopup && !isEditing && (
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
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className={`relative h-full p-6 overflow-y-auto ${isEditing ? 'editing-mode' : ''}`}>
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
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: processedContent.split('\n\n').map(p => `<p>${p}</p>`).join('') 
                  }} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
