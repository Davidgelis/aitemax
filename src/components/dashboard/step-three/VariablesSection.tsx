
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
  
  // When a variable changes in the Final Prompt area, update this section
  useEffect(() => {
    const handleVariableInputChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const variableId = input.dataset.variableId;
      
      if (variableId) {
        // Find all other inputs for this variable and update them
        document.querySelectorAll<HTMLInputElement>(`input[data-variable-id="${variableId}"]`).forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = input.value || "";
          }
        });
      }
    };

    // Add event listeners to all variable inputs
    document.addEventListener('input', handleVariableInputChange);
    
    return () => {
      document.removeEventListener('input', handleVariableInputChange);
    };
  }, [variables]);

  if (!variables || variables.length === 0) {
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
        {variables.map((variable, index) => (
          <div key={variable.id} className="flex items-center gap-2 min-w-[120px] max-w-[300px]">
            <span className="text-xs font-medium min-w-[25px]">{index + 1}:</span>
            <Input 
              value={variable.value || ""}
              onChange={(e) => handleInputChange(variable.id, e.target.value)}
              className="h-7 text-xs py-1 px-2 bg-[#33fea6]/10 border-[#33fea6]/20 focus-visible:border-[#33fea6] focus-visible:ring-0"
              data-variable-id={variable.id}
              placeholder="Type here..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};
