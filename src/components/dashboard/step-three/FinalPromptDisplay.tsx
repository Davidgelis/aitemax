
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Pencil } from "lucide-react";

export interface FinalPromptDisplayProps {
  finalPrompt: string;
  setFinalPrompt?: React.Dispatch<React.SetStateAction<string>>;
  editingPrompt: string;
  setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: () => void;
  getProcessedPrompt: () => string;
}

export const FinalPromptDisplay = ({
  finalPrompt,
  setFinalPrompt,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt,
  getProcessedPrompt
}: FinalPromptDisplayProps) => {
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedText, setHighlightedText] = useState<string>("");

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setHighlightedText(selection.toString().trim());
    } else {
      setHighlightedText("");
    }
  };
  
  useEffect(() => {
    const container = promptContainerRef.current;
    if (container) {
      container.addEventListener("mouseup", handleSelection);
      container.addEventListener("touchend", handleSelection);
    }
    
    return () => {
      if (container) {
        container.removeEventListener("mouseup", handleSelection);
        container.removeEventListener("touchend", handleSelection);
      }
    };
  }, []);

  const processedPrompt = getProcessedPrompt();

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-medium">Final Prompt</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="xs" 
            onClick={handleOpenEditPrompt}
            className="text-xs hover:bg-[#33fea6]/20 flex items-center gap-1.5"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="xs" 
            onClick={handleAdaptPrompt}
            className="text-xs hover:bg-[#33fea6]/20 flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            Adapt
          </Button>
        </div>
      </div>
      
      <div 
        ref={promptContainerRef}
        className="p-4 border rounded-md bg-white overflow-y-auto max-h-[400px] whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: processedPrompt }}
      />
      
      <Sheet open={showEditPromptSheet} onOpenChange={setShowEditPromptSheet}>
        <SheetContent className="sm:max-w-lg" side="right">
          <SheetHeader>
            <SheetTitle>Edit Prompt</SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            <Textarea 
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="min-h-[60vh] font-mono text-sm"
            />
          </div>
          
          <SheetFooter>
            <Button onClick={() => setShowEditPromptSheet(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSaveEditedPrompt} className="bg-[#33fea6] hover:bg-[#28d88c] text-white">
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
