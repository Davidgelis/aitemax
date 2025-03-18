
import { Edit, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Variable } from "@/components/dashboard/types";

interface FinalPromptDisplayProps {
  finalPrompt: string;
  updateFinalPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection: (variableId: string, selectedText: string) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  editablePrompt: string;
  setEditablePrompt: (prompt: string) => void;
  handleSaveEditedPrompt: () => void;
  jsonData?: any;
  isRefreshingJson?: boolean;
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
  jsonData,
  isRefreshingJson = false
}: FinalPromptDisplayProps) => {
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [currentEditingContent, setCurrentEditingContent] = useState("");
  const [hasInitializedEditMode, setHasInitializedEditMode] = useState(false);
  
  // Begin editing mode
  const startEditing = () => {
    setIsEditing(true);
    // Get the processed prompt with variables as HTML
    const processedPrompt = getProcessedPrompt();
    
    // Convert variables to non-editable spans
    let editableContent = processedPrompt;
    
    // Replace HTML variable elements with non-editable spans
    variables.filter(v => v.isRelevant).forEach(variable => {
      const varRegex = new RegExp(`<span[^>]*data-variable-id="${variable.id}"[^>]*>.*?</span>`, 'g');
      editableContent = editableContent.replace(varRegex, 
        `<span class="non-editable-variable" contentEditable="false" data-variable-id="${variable.id}">${variable.value || ""}</span>`);
    });
    
    // Replace any remaining {{variable}} format
    variables.filter(v => v.isRelevant).forEach(variable => {
      if (variable.name) {
        const templateRegex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        editableContent = editableContent.replace(templateRegex, 
          `<span class="non-editable-variable" contentEditable="false" data-variable-id="${variable.id}">${variable.value || ""}</span>`);
      }
    });
    
    setCurrentEditingContent(editableContent);
    setHasInitializedEditMode(true);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setCurrentEditingContent("");
    setHasInitializedEditMode(false);
  };
  
  // Save edited content
  const saveEditing = () => {
    if (promptContainerRef.current) {
      // Get the content from the editable div
      let newContent = promptContainerRef.current.innerHTML;
      
      // Replace non-editable variables with their original format
      variables.filter(v => v.isRelevant).forEach(variable => {
        // Updated regex that uses lookahead assertions to match attributes regardless of order
        const nonEditableRegex = new RegExp(
          `<span(?=[^>]*\\bclass=['"]non-editable-variable['"])(?=[^>]*\\bdata-variable-id=["']${variable.id}["'])[^>]*>[^<]*</span>`,
          'gi'
        );
        
        // Convert back to the original format expected by the app
        newContent = newContent.replace(nonEditableRegex, 
          `<span data-variable-id="${variable.id}" contenteditable="false" class="variable-highlight">${variable.value || ""}</span>`);
      });
      
      // Set the final prompt
      updateFinalPrompt(newContent);
      handleSaveEditedPrompt();
      setIsEditing(false);
      setHasInitializedEditMode(false);
    }
  };
  
  // Function to create a variable from selected text
  const createVariableFromSelection = async () => {
    if (!selectedText.trim()) return;
    
    // Find an unused variable (one that is not relevant)
    const unusedVariable = variables.find(v => !v.isRelevant);
    
    if (unusedVariable) {
      // Get the current prompt HTML
      const currentPrompt = promptContainerRef.current?.innerHTML || "";
      
      // Mark variable as relevant and set its value and selection
      const updatedVariables = variables.map(v => 
        v.id === unusedVariable.id 
          ? { ...v, isRelevant: true, value: selectedText.trim(), selection: selectedText.trim() } 
          : v
      );
      
      setVariables(updatedVariables);
      recordVariableSelection(unusedVariable.id, selectedText.trim());
      
      setSelectedText("");
    }
  };
  
  // Listen for text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!isEditing) {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && promptContainerRef.current?.contains(selection.anchorNode)) {
          setSelectedText(selection.toString());
        } else {
          setSelectedText("");
        }
      }
    };
    
    document.addEventListener("selectionchange", handleSelectionChange);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isEditing]);
  
  // Set initial editing content when entering edit mode
  useEffect(() => {
    if (isEditing && !hasInitializedEditMode) {
      setHasInitializedEditMode(true);
      const processedPrompt = getProcessedPrompt();
      setCurrentEditingContent(processedPrompt);
    }
  }, [isEditing, hasInitializedEditMode, getProcessedPrompt]);
  
  // Prepare JSON content
  const getJsonContent = () => {
    // Use provided jsonData if available, otherwise create a basic JSON structure
    if (jsonData) {
      return JSON.stringify(jsonData, null, 2);
    }
    
    return JSON.stringify({ 
      prompt: finalPrompt, 
      masterCommand,
      variables: variables.filter(v => v.isRelevant === true)
    }, null, 2);
  };

  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      {!isEditing ? (
        <button 
          onClick={startEditing}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white edit-icon-button"
          title="Edit prompt"
        >
          <Edit className="w-4 h-4 text-accent edit-icon" />
        </button>
      ) : (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button 
            onClick={cancelEditing}
            className="edit-action-button edit-cancel-button"
            title="Cancel editing"
          >
            Cancel
          </button>
          <button 
            onClick={saveEditing}
            className="edit-action-button edit-save-button"
            title="Save changes"
          >
            Save
          </button>
        </div>
      )}
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className={`relative h-full p-6 overflow-y-auto ${isEditing ? 'editing-mode' : ''}`}>
        <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
        
        {!isEditing ? (
          <div className="whitespace-pre-wrap text-card-foreground">
            {showJson ? (
              <pre className="text-xs font-mono relative">
                {isRefreshingJson ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : null}
                {getJsonContent()}
              </pre>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div 
                  ref={promptContainerRef}
                  dangerouslySetInnerHTML={{ __html: getProcessedPrompt().split('\n\n').map(p => `<p>${p}</p>`).join('') }} 
                />
              </div>
            )}
          </div>
        ) : (
          <div 
            ref={promptContainerRef}
            className="whitespace-pre-wrap text-card-foreground editable-content" 
            contentEditable="true"
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: currentEditingContent }}
          />
        )}
      </div>
    </div>
  );
};
