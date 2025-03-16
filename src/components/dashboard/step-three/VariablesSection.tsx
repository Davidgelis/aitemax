
import { Input } from "@/components/ui/input";
import { Variable } from "../types";
import { useEffect, useCallback } from "react";

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
}

export const VariablesSection = ({
  variables,
  handleVariableValueChange
}: VariablesSectionProps) => {
  
  // Optimize variable value changes
  const handleInputChange = useCallback((variableId: string, newValue: string) => {
    // Log changes to help debug
    console.log("Variable section changing value:", variableId, newValue);
    
    try {
      // Update the variable value
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

  if (!variables || variables.length === 0) {
    return (
      <div className="mb-4 p-3 border rounded-lg bg-background/50">
        <h4 className="text-sm font-medium mb-3">Variables</h4>
        <p className="text-xs text-muted-foreground">No variables available. Select text in the prompt to create variables.</p>
      </div>
    );
  }

  // Make sure we're only using relevant variables
  const relevantVariables = variables.filter(v => v.isRelevant === true);
  
  if (relevantVariables.length === 0) {
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
      <div className="flex flex-wrap gap-3">
        {relevantVariables.map((variable, index) => (
          <div key={variable.id} className="flex items-center gap-2 min-w-[120px] max-w-[300px]">
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
        ))}
      </div>
    </div>
  );
};
