import { Edit, Copy, Save, RotateCw, X, Check, RefreshCw } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { primaryToggles, secondaryToggles } from "./constants";
import { Variable } from "./types";
import { useToast } from "@/hooks/use-toast";
import { VariablesSection } from "./step-three/VariablesSection";
import { ToggleSection } from "./step-three/ToggleSection";

interface FinalPromptProps {
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
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: () => void;
  onDeleteVariable?: (variableId: string) => void;
}

export const FinalPrompt = ({
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
  handleAdaptPrompt,
  onDeleteVariable
}: FinalPromptProps) => {
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditingContent, setCurrentEditingContent] = useState("");
  const [hasInitializedEditMode, setHasInitializedEditMode] = useState(false);
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleRefreshJson = () => {
    setIsRefreshingJson(true);
    setRefreshTrigger(prev => prev + 1);
    // The refreshTrigger will be picked up by child components
  };
  
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
      setEditingPrompt(newContent);
      handleSaveEditedPrompt();
      setIsEditing(false);
      setHasInitializedEditMode(false);
      
      toast({
        title: "Changes saved",
        description: "Your prompt has been updated successfully.",
      });
    }
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

      <ToggleSection 
        showJson={showJson} 
        setShowJson={setShowJson} 
        refreshJson={handleRefreshJson}
        isRefreshing={isRefreshingJson}
      />

      <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
        {!isEditing ? (
          <button 
            onClick={startEditing}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white edit-icon-button"
          >
            <Edit className="w-4 h-4 text-accent edit-icon" />
          </button>
        ) : (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button 
              onClick={cancelEditing}
              className="p-2 rounded-full bg-white edit-icon-button"
              title="Cancel editing"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
            <button 
              onClick={saveEditing}
              className="p-2 rounded-full bg-white edit-icon-button"
              title="Save changes"
            >
              <Check className="w-4 h-4 text-[#33fea6]" />
            </button>
          </div>
        )}
        
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
          style={{ backgroundSize: "400% 400%" }}
        />
        
        <div className="relative h-full p-6">
          <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
          
          <div className="h-[calc(100%-3rem)] overflow-auto prompt-content-container">
            {!isEditing ? (
              <div className="whitespace-pre-wrap text-card-foreground">
                {showJson ? (
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify({ 
                      prompt: finalPrompt, 
                      masterCommand,
                      variables: variables.filter(v => v.isRelevant === true)
                    }, null, 2)}
                  </pre>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: getProcessedPrompt().split('\n\n').map(p => `<p>${p}</p>`).join('') }} />
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
      </div>

      <VariablesSection 
        variables={variables} 
        handleVariableValueChange={handleVariableValueChange}
        onDeleteVariable={onDeleteVariable}
      />

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
    </div>
  );
};
