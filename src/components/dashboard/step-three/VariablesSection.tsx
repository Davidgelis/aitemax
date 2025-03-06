
import { Variable as LucideVariable, Edit } from "lucide-react";
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
  const relevantVariables = variables.filter(v => v.isRelevant === true);
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Initialize highlighted state and editing values based on current variables
  useEffect(() => {
    if (!variables || variables.length === 0) return;
    
    const initialHighlightState: Record<string, boolean> = {};
    const initialEditingValues: Record<string, string> = {};
    
    relevantVariables.forEach(variable => {
      if (variable && variable.id) {
        initialHighlightState[variable.id] = variable.value && variable.value.trim() !== '';
        initialEditingValues[variable.id] = variable.value || '';
      }
    });
    
    setHighlightedVariables(initialHighlightState);
    setEditingValues(initialEditingValues);
  }, [relevantVariables]);

  // Handle input change with controlled components
  const handleInputChange = (variableId: string, value: string) => {
    if (!variableId) return;
    
    // Update local state first
    setEditingValues(prev => ({
      ...prev,
      [variableId]: value
    }));
    
    // Update parent state
    handleVariableValueChange(variableId, value);
    
    // Update highlight state
    setHighlightedVariables(prev => ({
      ...prev,
      [variableId]: value.trim() !== ''
    }));
  };

  // Reset a variable value
  const handleReset = (variableId: string) => {
    if (!variableId) return;
    handleInputChange(variableId, "");
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-background/50">
      <div className="flex items-center gap-2 mb-3">
        <LucideVariable className="w-5 h-5 text-accent" />
        <h4 className="text-md font-medium">Dynamic Variables</h4>
      </div>
      
      {relevantVariables && relevantVariables.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 max-h-[250px] overflow-y-auto pr-2">
          {relevantVariables.map((variable) => (
            variable && variable.id ? (
              <div key={variable.id} className="variable-card bg-white border border-[#33fea6] rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[#545454]">{variable.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#545454] italic">
                      {variable.category || "Custom"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="text"
                    value={editingValues[variable.id] || ""}
                    onChange={(e) => handleInputChange(variable.id, e.target.value)}
                    className={`flex-1 h-9 px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#33fea6] transition-all ${
                      highlightedVariables[variable.id] ? 'border-[#33fea6]' : 'border-gray-300'
                    }`}
                    placeholder="Enter value..."
                  />
                  <button 
                    onClick={() => handleReset(variable.id)}
                    className="p-1.5 rounded-md bg-white border border-[#33fea6] hover:bg-gray-50 transition-colors"
                    title="Reset value"
                  >
                    <Edit className="w-4 h-4 text-[#545454]" />
                  </button>
                </div>
              </div>
            ) : null
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <LucideVariable className="w-10 h-10 text-[#33fea6] opacity-30 mb-2" />
          <p className="text-sm text-[#545454]">No variables available</p>
          <p className="text-xs text-[#545454] mt-1 max-w-md">
            Variables will appear here after analyzing your prompt in step 2
          </p>
        </div>
      )}
    </div>
  );
};
