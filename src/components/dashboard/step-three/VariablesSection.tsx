
import { Variable } from "../types";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
  
  // Set preferred category order
  const categoryOrder = ["Task", "Persona", "Conditions", "Instructions", "Other"];
  
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

  // Handle immediate variable value change - directly updates the variable
  const handleInputChange = (variableId: string, newValue: string) => {
    console.log("Variable section changing value:", variableId, newValue);
    handleVariableValueChange(variableId, newValue);
  };
  
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
  
  if (relevantVariablesCount === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-accent font-medium">Variables (0)</h3>
        </div>
        <div className="bg-background/50 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No variables detected in your prompt. Edit your prompt to add variables using {'{{'} variableName {'}}'} syntax.
          </p>
        </div>
      </div>
    );
  }
  
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
        <div className="space-y-3">
          {/* Sort categories according to the defined order */}
          {categoryOrder
            .filter(category => groupedVariables[category] && groupedVariables[category].length > 0)
            .map((category, categoryIndex) => (
              <div key={category} className="bg-background/50 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-2">{category}</h3>
                <div className="space-y-3">
                  {groupedVariables[category].map((variable, variableIndex) => {
                    const globalIndex = categoryIndex + variableIndex + 1;
                    return (
                      <div key={variable.id} className="flex gap-3 items-center">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                          {globalIndex}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            type="text"
                            value={variable.name}
                            readOnly
                            className="flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] bg-background focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6]"
                          />
                          <Input
                            type="text"
                            placeholder="Value"
                            value={variable.value || ""}
                            onChange={(e) => handleInputChange(variable.id, e.target.value)}
                            className={`flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6] ${
                              variable.value ? 'border-[#33fea6] ring-1 ring-[#33fea6]' : ''
                            }`}
                            autoComplete="off"
                            aria-label={`Value for ${variable.name || 'variable'} ${globalIndex}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          
          {/* Handle any categories not in our predefined order */}
          {Object.keys(groupedVariables)
            .filter(category => !categoryOrder.includes(category))
            .map((category, categoryIndex) => (
              <div key={category} className="bg-background/50 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-2">{category}</h3>
                <div className="space-y-3">
                  {groupedVariables[category].map((variable, variableIndex) => {
                    const globalIndex = categoryOrder.length + categoryIndex + variableIndex + 1;
                    return (
                      <div key={variable.id} className="flex gap-3 items-center">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                          {globalIndex}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            type="text"
                            value={variable.name}
                            readOnly
                            className="flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] bg-background focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6]"
                          />
                          <Input
                            type="text"
                            placeholder="Value"
                            value={variable.value || ""}
                            onChange={(e) => handleInputChange(variable.id, e.target.value)}
                            className={`flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6] ${
                              variable.value ? 'border-[#33fea6] ring-1 ring-[#33fea6]' : ''
                            }`}
                            autoComplete="off"
                            aria-label={`Value for ${variable.name || 'variable'} ${globalIndex}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
