
import { Edit, Copy, Save, RotateCw } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { primaryToggles, secondaryToggles } from "./constants";
import { Variable } from "./types";

interface StepThreeContentProps {
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  finalPrompt: string;
  getProcessedPrompt: () => string;
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: (editingPrompt: string) => void;
  handleAdaptPrompt: () => void;
}

export const StepThreeContent = ({
  masterCommand,
  setMasterCommand,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  showJson,
  setShowJson,
  finalPrompt,
  getProcessedPrompt,
  variables,
  handleVariableValueChange,
  handleCopyPrompt,
  handleSavePrompt,
  handleRegenerate,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt
}: StepThreeContentProps) => {
  const editPromptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const relevantVariables = variables.filter(v => v.isRelevant === true);
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});

  // Initialize highlighted state based on current values
  useEffect(() => {
    const initialHighlightState: Record<string, boolean> = {};
    relevantVariables.forEach(variable => {
      initialHighlightState[variable.id] = variable.value && variable.value.trim() !== '';
    });
    setHighlightedVariables(initialHighlightState);
  }, [relevantVariables]);

  // Render the processed prompt with highlighted variables
  const renderProcessedPrompt = () => {
    if (showJson) {
      return (
        <pre className="text-xs font-mono">
          {JSON.stringify({ 
            prompt: finalPrompt, 
            masterCommand,
            variables: variables.filter(v => v.isRelevant === true)
          }, null, 2)}
        </pre>
      );
    }

    // Format the prompt with variable highlighting
    const processedPrompt = getProcessedPrompt();
    const paragraphs = processedPrompt.split('\n\n');
    
    // Highlight variables in the prompt
    return (
      <div className="prose prose-sm max-w-none">
        {paragraphs.map((paragraph, index) => {
          let content = paragraph;
          
          // Look for variable values in the content
          relevantVariables.forEach(variable => {
            if (variable.value && variable.value.trim() !== '') {
              const regex = new RegExp(`(${escapeRegExp(variable.value)})`, 'g');
              content = content.replace(regex, '<span class="variable-highlight">$1</span>');
            }
          });
          
          return (
            <p key={index} dangerouslySetInnerHTML={{ __html: content }} />
          );
        })}
      </div>
    );
  };

  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <Input
            value={masterCommand}
            onChange={(e) => setMasterCommand(e.target.value)}
            placeholder="Master command, use it to adapt the prompt to any other similar needs"
            className="w-full h-8 text-sm"
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="aurora-button inline-flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              <span>Adapt</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will regenerate your prompt. Any manual changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegenerate}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-1.5">
          {primaryToggles.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
              <span className="text-xs">{item.label}</span>
              <Switch
                checked={selectedPrimary === item.id}
                onCheckedChange={() => handlePrimaryToggle(item.id)}
                className="scale-75"
                variant="primary"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {secondaryToggles.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
              <span className="text-xs">{item.label}</span>
              <Switch
                checked={selectedSecondary === item.id}
                onCheckedChange={() => handleSecondaryToggle(item.id)}
                className="scale-75"
                variant="secondary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">JSON Toggle view</span>
        <Switch
          checked={showJson}
          onCheckedChange={setShowJson}
          className="scale-75"
        />
      </div>

      <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
        <button 
          onClick={handleOpenEditPrompt}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Edit className="w-4 h-4 text-accent" />
        </button>
        
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
          style={{ backgroundSize: "400% 400%" }}
        />
        
        <div className="relative h-full p-6 overflow-y-auto">
          <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
          <div className="whitespace-pre-wrap text-card-foreground">
            {renderProcessedPrompt()}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 border rounded-lg bg-background/50">
        <h4 className="text-sm font-medium mb-2">Variables</h4>
        <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-2">
          {relevantVariables.length > 0 ? (
            relevantVariables.map((variable) => (
              <div key={variable.id} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium min-w-[150px] break-words">{variable.name}:</span>
                <input 
                  type="text"
                  value={variable.value || ""}
                  onChange={(e) => handleVariableValueChange(variable.id, e.target.value)}
                  className="flex-1 h-7 px-2 py-1 bg-white border border-[#33fea6] rounded-md overflow-x-auto text-xs"
                />
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              No variables available
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handleCopyPrompt}
          className="aurora-button inline-flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={handleSavePrompt}
          className="aurora-button inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

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

      <style jsx global>{`
        .variable-highlight {
          background: white;
          border: 1px solid #33fea6;
          border-radius: 2px;
          padding: 1px 2px;
          margin: 0 1px;
        }
        .aurora-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, #041524, #084b49, #33fea6, #64bf95, white);
          background-size: 300% 100%;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          animation: aurora 8s ease infinite;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .aurora-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};
