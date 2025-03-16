
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Variable } from "../types";

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

  // Reset local state when the sheet opens
  useEffect(() => {
    if (open) {
      setLocalPrompt(editingPrompt);
    }
  }, [open, editingPrompt]);

  // Handle saving changes back to parent component
  const handleSave = () => {
    setEditingPrompt(localPrompt);
    onSave();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Edit Prompt</SheetTitle>
          <SheetDescription>
            Make changes to your prompt below. Click "Save Changes" when done.
          </SheetDescription>
        </SheetHeader>
        
        <Textarea
          className="min-h-[300px] font-sans text-sm"
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
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
