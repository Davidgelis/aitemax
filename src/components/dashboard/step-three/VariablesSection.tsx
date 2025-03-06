
import { Variable } from "../types";
import { useState, useEffect } from "react";

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
}

export const VariablesSection = ({
  variables,
  handleVariableValueChange
}: VariablesSectionProps) => {
  const [groupedVariables, setGroupedVariables] = useState<Record<string, Variable[]>>({});
  const [isVisible, setIsVisible] = useState(true);
  
  // Group variables by category
  useEffect(() => {
    if (!Array.isArray(variables)) {
      console.error("Invalid variables provided to VariablesSection:", variables);
      setGroupedVariables({});
      return;
    }
    
    const grouped: Record<string, Variable[]> = {};
    const relevantVars = variables.filter(v => v && v.isRelevant === true);
    
    relevantVars.forEach(variable => {
      const category = variable.category || "Other";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    });
    
    setGroupedVariables(grouped);
  }, [variables]);
  
  // Early return if there are no variables to display
  if (!variables || variables.length === 0) {
    return (
      <div className="bg-background/50 p-3 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">No variables available</p>
      </div>
    );
  }
  
  // Get count of relevant variables
  const relevantVariablesCount = variables.filter(v => v && v.isRelevant === true).length;
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="text-sm text-accent font-medium hover:underline focus:outline-none"
        >
          Variables ({relevantVariablesCount}) {isVisible ? '▼' : '►'}
        </button>
      </div>
      
      {isVisible && (
        <div className="space-y-4">
          {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
            <div key={category} className="bg-background/50 p-3 rounded-lg">
              <h3 className="text-sm font-medium mb-2">{category}</h3>
              <div className="grid gap-2">
                {categoryVariables.map(variable => (
                  <div key={variable.id} className="grid grid-cols-[1fr,2fr] gap-2">
                    <div className="text-xs text-muted-foreground py-1 px-2 bg-background rounded-md truncate">
                      {variable.name}
                    </div>
                    <input
                      type="text"
                      value={variable.value || ''}
                      onChange={(e) => handleVariableValueChange(variable.id, e.target.value)}
                      className="text-xs py-1 px-2 w-full bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
