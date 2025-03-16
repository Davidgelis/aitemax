
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Variable } from "../types";
import { Loader2 } from "lucide-react";

interface EditPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrompt: string;
  setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;
  onSave: () => void;
  variables: Variable[];
}

export const EditPromptSheet = ({
  open,
  onOpenChange,
  editingPrompt,
  setEditingPrompt,
  onSave,
  variables
}: EditPromptSheetProps) => {
  const [localPrompt, setLocalPrompt] = useState("");
  const [isInserting, setIsInserting] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Reset local state when the sheet opens
  useEffect(() => {
    if (open) {
      setLocalPrompt(editingPrompt);
      setSelectedVariable(null);
      setCursorPosition(null);
    }
  }, [open, editingPrompt]);

  // Handle saving changes back to parent component
  const handleSave = () => {
    setEditingPrompt(localPrompt);
    onSave();
  };

  // Track cursor position in textarea
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);
    setTextareaRef(textarea);
  };

  // Insert variable at cursor position
  const insertVariable = (variable: Variable) => {
    setIsInserting(true);
    setSelectedVariable(variable);
    
    try {
      if (cursorPosition !== null) {
        const variableText = `{{${variable.name}}}`;
        const before = localPrompt.substring(0, cursorPosition);
        const after = localPrompt.substring(cursorPosition);
        
        const newText = before + variableText + after;
        setLocalPrompt(newText);
        
        // This will run after render and set cursor position after the inserted variable
        setTimeout(() => {
          if (textareaRef) {
            const newPosition = cursorPosition + variableText.length;
            textareaRef.focus();
            textareaRef.setSelectionRange(newPosition, newPosition);
            setCursorPosition(newPosition);
          }
          setIsInserting(false);
          setSelectedVariable(null);
        }, 50);
      } else {
        // If no cursor position, append to the end
        setLocalPrompt(prev => prev + `{{${variable.name}}}`);
        setIsInserting(false);
        setSelectedVariable(null);
      }
    } catch (error) {
      console.error("Error inserting variable:", error);
      setIsInserting(false);
      setSelectedVariable(null);
    }
  };

  // Get only the relevant variables
  const relevantVariables = variables.filter(v => v.isRelevant !== false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Edit Prompt</SheetTitle>
          <SheetDescription>
            Make changes to your prompt below. Click "Save Changes" when done.
          </SheetDescription>
        </SheetHeader>
        
        {relevantVariables.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Insert Variable:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {relevantVariables.map(variable => (
                <Button
                  key={variable.id}
                  size="sm"
                  variant="outline"
                  className={`text-xs ${selectedVariable?.id === variable.id ? 'bg-primary text-primary-foreground' : ''}`}
                  disabled={isInserting}
                  onClick={() => insertVariable(variable)}
                >
                  {isInserting && selectedVariable?.id === variable.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  {variable.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <Textarea
          className="min-h-[300px] font-mono text-sm"
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          onClick={handleTextareaClick}
          onKeyUp={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
        />
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
