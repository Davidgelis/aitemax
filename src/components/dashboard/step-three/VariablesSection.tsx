import { Input } from "@/components/ui/input";
import { Variable } from "../types";
import { useEffect, useCallback, useState } from "react";
import { Trash2, HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  onDeleteVariable?: (variableId: string) => void;
}

export const VariablesSection = ({
  variables,
  handleVariableValueChange,
  onDeleteVariable
}: VariablesSectionProps) => {
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const maxCharacterLimit = 100; // Set character limit to 100
  
  // Optimize variable value changes
  const handleInputChange = useCallback((variableId: string, newValue: string) => {
    console.log("Variable section changing value:", variableId, newValue);
    
    try {
      if (typeof handleVariableValueChange === 'function') {
        handleVariableValueChange(variableId, newValue);
      }
    } catch (error) {
      console.error("Error changing variable value:", error);
    }
  }, [handleVariableValueChange]);
  
  // Only handle synchronization of variable inputs with the same ID
  useEffect(() => {
    const handleVariableSync = (event: CustomEvent) => {
      const { variableId, newValue } = event.detail;
      if (variableId) {
        // Find all other inputs for this variable and update them
        document.querySelectorAll<HTMLInputElement>(`input[data-variable-id="${variableId}"]`).forEach(input => {
          if (input.dataset.source !== 'variables-section') {
            input.value = newValue || "";
          }
        });
      }
    };

    // Use a custom event for better control instead of the global input event
    document.addEventListener('variable-value-changed', handleVariableSync as EventListener);
    
    return () => {
      document.removeEventListener('variable-value-changed', handleVariableSync as EventListener);
    };
  }, []);

  const handleDelete = (variableId: string) => {
    if (onDeleteVariable) {
      onDeleteVariable(variableId);
    }
    setVariableToDelete(null);
  };

  const renderTechnicalTerms = (variable: Variable) => {
    if (!variable.technicalTerms || variable.technicalTerms.length === 0) return null;
    
    return (
      <div className="ml-4 mt-2 space-x-2">
        {variable.technicalTerms.map((term, index) => (
          <HoverCard key={index}>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center gap-1 text-xs bg-accent/10 px-2 py-1 rounded-full cursor-help">
                <HelpCircle className="h-3 w-3 text-blue-500" />
                <span className="font-medium">{term.term}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="bottom" className="max-w-[300px]">
              <div className="space-y-2">
                <p className="font-medium">{term.explanation}</p>
                <p className="text-sm text-muted-foreground">{term.example}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    );
  };

  // Filter only relevant variables
  const relevantVariables = variables.filter(v => v.isRelevant === true);

  if (!relevantVariables || relevantVariables.length === 0) {
    return (
      <div className="mb-4 p-3 border rounded-lg bg-background/50">
        <h4 className="text-sm font-medium mb-3">Variables</h4>
        <p className="text-xs text-muted-foreground">No variables available. Select text in the prompt to create variables.</p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 border rounded-lg bg-background/50">
      <h4 className="text-sm font-medium mb-3">Variables</h4>
      <div className="flex flex-col space-y-3">
        {relevantVariables.map((variable, index) => (
          <div key={variable.id} className="variable-container flex gap-3 items-center">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
              {index + 1}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sr-only">Variable name</div>
              <div className="flex items-center w-full relative">
                <Input 
                  value={variable.value || ""}
                  onChange={(e) => {
                    // Limit input to maxCharacterLimit characters
                    if (e.target.value.length <= maxCharacterLimit) {
                      handleInputChange(variable.id, e.target.value);
                    }
                  }}
                  className="h-9 rounded-md border text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6] pr-16"
                  data-variable-id={variable.id}
                  data-source="variables-section"
                  placeholder="Type here..."
                  maxLength={maxCharacterLimit}
                  onInput={(e) => {
                    // Dispatch a custom event when value changes from this component
                    const customEvent = new CustomEvent('variable-value-changed', {
                      detail: {
                        variableId: variable.id,
                        newValue: e.currentTarget.value
                      }
                    });
                    document.dispatchEvent(customEvent);
                  }}
                />
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  {(variable.value || "").length}/{maxCharacterLimit}
                </div>

                {variable.technicalTerms && variable.technicalTerms.length > 0 && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="p-2 rounded-full hover:bg-[#33fea6]/20 ml-1">
                        <HelpCircle className="h-4 w-4 text-[#545454]" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        {variable.technicalTerms.map((term, idx) => (
                          <div key={idx} className="space-y-1">
                            <h4 className="text-sm font-semibold">{term.term}</h4>
                            <p className="text-sm text-muted-foreground">{term.explanation}</p>
                            <p className="text-xs text-muted-foreground italic">Example: {term.example}</p>
                          </div>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
                
                {onDeleteVariable && (
                  <AlertDialog open={variableToDelete === variable.id} onOpenChange={(open) => !open && setVariableToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <button 
                        onClick={() => setVariableToDelete(variable.id)}
                        className="p-2 rounded-full hover:bg-[#33fea6]/20 ml-2"
                        aria-label="Delete variable"
                      >
                        <Trash2 className="w-4 h-4 text-[#545454]" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete variable?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this variable? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(variable.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
