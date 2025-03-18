
import { Input } from "@/components/ui/input";
import { Variable } from "../types";
import { useEffect, useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
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
      <div className="flex flex-col space-y-2">
        {relevantVariables.map((variable, index) => (
          <div key={variable.id} className="variable-container">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-medium min-w-[25px]">{index + 1}:</span>
              <Input 
                value={variable.value || ""}
                onChange={(e) => handleInputChange(variable.id, e.target.value)}
                className="h-7 text-xs py-1 px-2 bg-[#33fea6]/10 border-[#33fea6]/20 focus-visible:border-[#33fea6] focus-visible:ring-0"
                data-variable-id={variable.id}
                data-source="variables-section"
                placeholder="Type here..."
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
            </div>
            
            {onDeleteVariable && (
              <AlertDialog open={variableToDelete === variable.id} onOpenChange={(open) => !open && setVariableToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <button 
                    onClick={() => setVariableToDelete(variable.id)}
                    className="variable-delete-btn"
                    aria-label="Delete variable"
                  >
                    <Trash2 className="w-4 h-4" />
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
        ))}
      </div>
    </div>
  );
};
