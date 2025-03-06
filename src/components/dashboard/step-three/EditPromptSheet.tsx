
import { useRef } from "react";
import { RotateCw, Save } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EditPromptSheetProps {
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  handleSaveEditedPrompt: (editingPrompt: string) => void;
  handleAdaptPrompt: () => void;
}

export const EditPromptSheet = ({
  showEditPromptSheet,
  setShowEditPromptSheet,
  editingPrompt,
  setEditingPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt
}: EditPromptSheetProps) => {
  const editPromptTextareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Sheet open={showEditPromptSheet} onOpenChange={setShowEditPromptSheet}>
      <SheetContent className="w-[90%] sm:max-w-[600px] md:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>Edit Prompt</SheetTitle>
          <SheetDescription>
            Make changes to your prompt. Click save when you're done or adapt to regenerate the prompt.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <textarea
            ref={editPromptTextareaRef}
            value={editingPrompt}
            onChange={(e) => setEditingPrompt(e.target.value)}
            className="w-full min-h-[60vh] p-4 text-sm rounded-md border bg-gray-50/80 text-card-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <SheetFooter className="flex flex-row justify-end space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Adapt
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will regenerate your prompt based on the changes you made.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAdaptPrompt}>Yes, adapt it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            onClick={() => handleSaveEditedPrompt(editingPrompt)}
            className="aurora-button inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
