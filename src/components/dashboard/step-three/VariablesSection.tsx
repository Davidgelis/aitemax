import { Variable } from "../types";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { hasVariablePlaceholders } from "@/utils/promptUtils";

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  finalPrompt?: string;
}

export const VariablesSection = ({
  variables,
  handleVariableValueChange,
  finalPrompt = ""
}: VariablesSectionProps) => {
  const [groupedVariables, setGroupedVariables] = useState<Record<string, Variable[]>>({});
  const [isVisible, setIsVisible] = useState(true);
  const [relevantVariableIds, setRelevantVariableIds] = useState<Set<string>>(new Set());
  
  // Flag to check if prompt has variable placeholders
  const hasPlaceholders = finalPrompt ? hasVariablePlaceholders(finalPrompt) : false;
  
  // Determine which variables are actually used in the final prompt
  useEffect(() => {
    if (finalPrompt && variables.length > 0) {
      const usedVarIds = new Set<string>();
      
      variables.forEach(variable => {
        const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        if (pattern.test(finalPrompt)) {
          usedVarIds.add(variable.id);
        }
      });
      
      setRelevantVariableIds(usedVarIds);
    } else {
      // If no final prompt or no variables, consider all variables relevant
      const allVarIds = new Set(variables.map(v => v.id));
      setRelevantVariableIds(allVarIds);
    }
  }, [finalPrompt, variables]);
  
  // Group variables by category
  useEffect(() => {
    if (!Array.isArray(variables)) {
      console.error("Invalid variables provided to VariablesSection:", variables);
      setGroupedVariables({});
      return;
    }
    
    const grouped: Record<string, Variable[]> = {};
    
    // Filter variables based on relevance
    let filteredVars = variables;
    
    // If we have detected variables in the prompt text, only show those
    if (hasPlaceholders && relevantVariableIds.size > 0) {
      filteredVars = variables.filter(v => relevantVariableIds.has(v.id));
    } else {
      // Otherwise use the isRelevant flag
      filteredVars = variables.filter(v => v && v.isRelevant !== false);
    }
    
    filteredVars.forEach(variable => {
      const category = variable.category || "Other";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    });
    
    setGroupedVariables(grouped);
  }, [variables, relevantVariableIds, hasPlaceholders]);
  
  // Early return if there are no variables to display
  if (!variables || variables.length === 0) {
    return (
      <div className="bg-background/50 p-3 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">No variables available</p>
      </div>
    );
  }
  
  // Get count of relevant variables
  const relevantVariablesCount = hasPlaceholders 
    ? relevantVariableIds.size 
    : variables.filter(v => v && v.isRelevant !== false).length;
  
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
          {Object.entries(groupedVariables).map(([category, categoryVariables], categoryIndex) => (
            <div key={category} className="bg-background/50 p-3 rounded-lg">
              <h3 className="text-sm font-medium mb-2">{category}</h3>
              <div className="space-y-3">
                {categoryVariables.map((variable, variableIndex) => {
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
                          onChange={(e) => handleVariableValueChange(variable.id, e.target.value)}
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
