
import { useState, useEffect, useCallback, useMemo } from "react";
import { Variable } from "../types";
import { useToast } from "@/hooks/use-toast";

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
}

export const VariablesSection = ({
  variables,
  handleVariableValueChange
}: VariablesSectionProps) => {
  const [localVariableValues, setLocalVariableValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Initialize the local state from the variables
  useEffect(() => {
    if (!Array.isArray(variables)) return;
    
    const newValues: Record<string, string> = {};
    variables.forEach(variable => {
      if (variable && variable.id) {
        newValues[variable.id] = variable.value || "";
      }
    });
    setLocalVariableValues(newValues);
  }, [variables]);
  
  // Filter variables to only show relevant ones and group by category
  const groupedVariables = useMemo(() => {
    if (!Array.isArray(variables)) return {};
    
    const relevantVariables = variables.filter(v => 
      v && typeof v === 'object' && v.isRelevant === true
    );
    
    const grouped: Record<string, Variable[]> = {};
    relevantVariables.forEach(variable => {
      const category = variable.category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(variable);
    });
    
    return grouped;
  }, [variables]);
  
  // Debounced variable update handler
  const handleInputChange = useCallback((variableId: string, value: string) => {
    if (!variableId) return;
    
    // Update local state immediately for smooth typing
    setLocalVariableValues(prev => ({
      ...prev,
      [variableId]: value
    }));
    
    // Debounce the actual state update to avoid too many re-renders
    const timeoutId = setTimeout(() => {
      try {
        handleVariableValueChange(variableId, value);
      } catch (error) {
        console.error("Error updating variable value:", error);
        toast({
          title: "Error updating variable",
          description: "An error occurred while updating the variable. Please try again.",
          variant: "destructive"
        });
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [handleVariableValueChange, toast]);
  
  const categoryOrder = ["Task", "Persona", "Conditions", "Instructions", "Custom", "Other"];
  
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedVariables).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedVariables]);
  
  if (Object.keys(groupedVariables).length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg text-accent font-medium mb-2">Variables</h3>
      
      {sortedCategories.map(category => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">{category}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groupedVariables[category].map((variable) => {
              // Ensure the variable has a valid id
              if (!variable || !variable.id) return null;
              
              const localValue = localVariableValues[variable.id] !== undefined
                ? localVariableValues[variable.id]
                : variable.value || "";
                
              return (
                <div 
                  key={variable.id} 
                  className="bg-muted/30 p-4 rounded-lg border border-border"
                >
                  <label className="block text-sm font-medium mb-1">
                    {variable.name || "Unnamed Variable"}
                  </label>
                  <input
                    type="text"
                    value={localValue}
                    onChange={(e) => handleInputChange(variable.id, e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                    placeholder="Enter value..."
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
