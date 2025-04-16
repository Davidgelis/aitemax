import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Variable } from "./types";
import { ToggleSection } from "./step-three/ToggleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Copy, CheckCircle2, XCircle } from "lucide-react";
import { 
  convertPlaceholdersToSpans, 
  convertEditedContentToPlaceholders,
  createPlainTextPrompt
} from "@/utils/promptUtils";

interface FinalPromptProps {
  finalPrompt: string;
  updateFinalPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection: (variableId: string, selectedText: string) => void;
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
}

export const FinalPromptDisplay = ({
  finalPrompt,
  updateFinalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
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
  setLastSavedPrompt
}: FinalPromptProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Toggle expand
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Handle inline editing
  const handleInlineEdit = () => {
    setIsEditing(true);
    setEditablePrompt(finalPrompt);
  };
  
  // Handle save after inline editing
  const handleSaveInlineEdit = () => {
    try {
      handleSaveEditedPrompt();
      
      // Show success message
      setSuccessMessage("Prompt updated successfully!");
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error saving edited prompt:", error);
      
      // Show error message
      setErrorMessage(error.message || "Could not save edited prompt. Please try again.");
      setShowErrorMessage(true);
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 5000);
    }
  };
  
  // Handle cancel inline editing
  const handleCancelInlineEdit = () => {
    setIsEditing(false);
    setEditablePrompt("");
  };
  
  // Handle changes in the editable prompt
  const handleEditablePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditablePrompt(e.target.value);
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      // Use our new utility to get clean plain text without HTML or placeholders
      const textToCopy = createPlainTextPrompt(finalPrompt, variables.filter(v => v && v.isRelevant === true));
      await navigator.clipboard.writeText(textToCopy);
      
      toast({
        title: "Copied to clipboard",
        description: "Prompt has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy prompt to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="final-prompt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          Final Prompt
        </Label>
        <div className="flex items-center space-x-2">
          {/* Edit Button */}
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleInlineEdit}
              title="Edit prompt inline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          {/* Save and Cancel Buttons (Visible only when editing) */}
          {isEditing && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveInlineEdit}
                title="Save edited prompt"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancelInlineEdit}
                title="Cancel editing"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          
          {/* Copy Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyToClipboard}
            title="Copy prompt to clipboard"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="text-green-500 text-sm mb-2">
          {successMessage}
        </div>
      )}
      
      {/* Error Message */}
      {showErrorMessage && (
        <div className="text-red-500 text-sm mb-2">
          {errorMessage}
        </div>
      )}
      
      {/* Display the final prompt */}
      <div className="relative">
        {isEditing ? (
          <textarea
            id="final-prompt"
            className="w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            value={editablePrompt}
            onChange={handleEditablePromptChange}
          />
        ) : (
          <div
            id="final-prompt"
            className={`w-full p-3 border rounded-md break-words ${isExpanded ? 'h-auto' : 'h-32 overflow-hidden'}`}
            style={{ whiteSpace: 'pre-line' }}
          >
            <div dangerouslySetInnerHTML={{ __html: getProcessedPrompt() }} />
            {!isExpanded && finalPrompt.length > 200 && (
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white flex justify-center items-end">
                <Button variant="link" onClick={toggleExpand}>
                  Show More
                </Button>
              </div>
            )}
            {isExpanded && (
              <div className="flex justify-center mt-2">
                <Button variant="link" onClick={toggleExpand}>
                  Show Less
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
