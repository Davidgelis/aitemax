
import React, { useState, useRef, RefObject } from "react";
import { Variable, TechnicalTerm } from "./types";
import { HelpCircle, X, Plus, InfoIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-mobile";

interface VariableListProps {
  variables: Variable[];
  onVariableChange: (variableId: string, field: keyof Variable, content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: () => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt?: string;
}

export const VariableList = ({
  variables,
  onVariableChange,
  onVariableRelevance,
  onAddVariable,
  onDeleteVariable,
  variableToDelete,
  setVariableToDelete,
  containerRef,
  originalPrompt
}: VariableListProps) => {
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { toast } = useToast();
  
  // Filter variables that have a name and are marked as relevant
  const relevantVariables = variables.filter(
    v => v && v.name && v.name.trim() !== "" && v.isRelevant !== false
  );
  
  // Filter variables that don't have a name or are marked as not relevant
  const irrelevantVariables = variables.filter(
    v => !v || !v.name || v.name.trim() === "" || v.isRelevant === false
  );
  
  const copyVariableCode = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(`{{VAR:${code}}}`);
      toast({
        title: "Copied to clipboard",
        description: `Variable code {{VAR:${code}}} has been copied to your clipboard.`,
      });
    }
  };
  
  const handleVariableChange = (variableId: string, field: keyof Variable, value: string) => {
    if (field === 'name' || field === 'value') {
      onVariableChange(variableId, field, value);
    }
  };
  
  const toggleVariableRelevance = (variableId: string, currentRelevance: boolean | null) => {
    // Toggle between relevant (true) and not relevant (false)
    const newRelevance = currentRelevance === false ? true : false;
    onVariableRelevance(variableId, newRelevance);
  };
  
  const confirmDelete = (id: string) => {
    setVariableToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirmed = () => {
    onDeleteVariable();
    setShowDeleteConfirm(false);
  };
  
  const renderTechnicalTerms = (variable: Variable) => {
    if (!variable.technicalTerms || variable.technicalTerms.length === 0) return null;
    
    return (
      <div className="ml-4 mt-2 space-x-2">
        {variable.technicalTerms.map((term, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center gap-1 text-xs bg-accent/10 px-2 py-1 rounded-full cursor-help">
                  <HelpCircle className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">{term.term}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                <div className="space-y-2">
                  <p className="font-medium">{term.explanation}</p>
                  <p className="text-sm text-muted-foreground">{term.example}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Variables</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setHelpOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <InfoIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learn more about variables</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <button 
          onClick={onAddVariable}
          className="flex items-center gap-1 text-sm hover:bg-primary/10 text-primary p-2 rounded-full transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2 space-y-4">
        {relevantVariables.length === 0 && irrelevantVariables.length === 0 && (
          <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-md">
            No variables detected. Add variables to customize your prompt.
          </p>
        )}
        
        {/* Relevant Variables */}
        {relevantVariables.length > 0 && (
          <div className="space-y-3">
            {relevantVariables.map((variable) => (
              <div key={variable.id} className="p-4 border rounded-lg bg-background">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={variable.name || ''}
                        onChange={(e) => handleVariableChange(variable.id, 'name', e.target.value)}
                        placeholder="Variable name"
                        className="text-sm font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full max-w-[150px]"
                      />
                      
                      {variable.code && (
                        <button 
                          onClick={() => copyVariableCode(variable.code || '')}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                          title="Copy variable code"
                        >
                          {`{{VAR:${variable.code}}}`}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleVariableRelevance(variable.id, variable.isRelevant)}
                        className="p-2 rounded-full hover:bg-[#33fea6]/20"
                        title="Mark as not relevant"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Add technical terms explanation */}
                  {renderTechnicalTerms(variable)}
                  
                  <div>
                    <textarea
                      value={variable.value || ''}
                      onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
                      placeholder="Variable value"
                      className="w-full text-sm border rounded-md p-2 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Irrelevant Variables */}
        {irrelevantVariables.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Not Relevant</h4>
            <div className="space-y-2 opacity-60">
              {irrelevantVariables.map((variable) => (
                <div key={variable.id} className="p-3 border border-dashed rounded-lg bg-background/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={variable.name || ''}
                        onChange={(e) => handleVariableChange(variable.id, 'name', e.target.value)}
                        placeholder="Variable name"
                        className="text-sm font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleVariableRelevance(variable.id, variable.isRelevant)}
                        className="p-1 rounded-full hover:bg-[#33fea6]/20 text-xs"
                        title="Mark as relevant"
                      >
                        Use
                      </button>
                      <button 
                        onClick={() => confirmDelete(variable.id)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500 text-xs"
                        title="Delete variable"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Variables Help Sheet */}
      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-[90%] sm:max-w-[500px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>About Variables</SheetTitle>
            <SheetDescription>
              Variables make your prompts more flexible and reusable.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm">
              Variables are placeholders in your prompt that can be filled with different values each time you use the prompt. They allow you to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Customize your prompt without rewriting it</li>
              <li>Adapt your prompt to different contexts or scenarios</li>
              <li>Make your prompts more reusable across different projects</li>
            </ul>
            <div className="p-3 bg-primary/5 rounded-md">
              <h4 className="font-medium text-sm mb-2">How to use variables:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Give your variable a descriptive name</li>
                <li>Fill in the variable's value</li>
                <li>Use the variable code in your prompt by clicking on the code to copy it</li>
                <li>Variables you mark as "not relevant" won't be included in your final prompt</li>
              </ol>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Sheet */}
      <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-[90%] sm:max-w-[400px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>Delete Variable</SheetTitle>
            <SheetDescription>
              Are you sure you want to delete this variable?
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm">
              This action cannot be undone. This will permanently delete the variable
              from your prompt.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
