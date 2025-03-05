
import { Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Variable } from "./types";
import { RefObject, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { filterCategoryVariables } from "./constants";

interface VariableListProps {
  variables: Variable[];
  onVariableChange: (variableId: string, field: 'name' | 'value', content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: (id: string) => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  containerRef: RefObject<HTMLDivElement>;
}

export const VariableList = ({
  variables,
  onVariableChange,
  onVariableRelevance,
  onAddVariable,
  onDeleteVariable,
  variableToDelete,
  setVariableToDelete,
  containerRef
}: VariableListProps) => {
  // Track which variables have values to highlight them
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});
  
  // Filter out category names and empty names
  const filteredVariables = filterCategoryVariables(variables).filter(v => v.name.trim() !== '');
  
  // Group variables by category
  const groupedVariables: Record<string, Variable[]> = {};
  
  filteredVariables.forEach(variable => {
    const category = variable.category || 'Other';
    if (!groupedVariables[category]) {
      groupedVariables[category] = [];
    }
    groupedVariables[category].push(variable);
  });

  // Get all categories with valid variables
  const categories = Object.keys(groupedVariables);
  const hasValidVariables = categories.length > 0 && 
    categories.some(category => groupedVariables[category].length > 0);

  // Handle variable value change with highlighting
  const handleValueChange = (variableId: string, value: string) => {
    // Track the highlighted state based on whether the value has content
    setHighlightedVariables(prev => ({
      ...prev,
      [variableId]: value.trim() !== ''
    }));
    
    // Call the original change handler
    onVariableChange(variableId, 'value', value);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Variables</h3>
        <button 
          onClick={onAddVariable}
          className="flex items-center gap-1 text-sm text-[#33fea6] hover:text-[#33fea6]/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add variable
        </button>
      </div>
      
      <div ref={containerRef} className="max-h-[280px] overflow-y-auto pr-2 space-y-4">
        {hasValidVariables ? (
          categories.map((category) => (
            groupedVariables[category].length > 0 && (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-accent">{category}</h4>
                
                {groupedVariables[category].map((variable, index) => (
                  <div key={variable.id} className="flex gap-3 items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Variable name"
                        value={variable.name}
                        onChange={(e) => onVariableChange(variable.id, 'name', e.target.value)}
                        className="flex-1 h-9"
                      />
                      <Input
                        placeholder="Value"
                        value={variable.value}
                        onChange={(e) => handleValueChange(variable.id, e.target.value)}
                        className={`flex-1 h-9 ${highlightedVariables[variable.id] ? 'border-[#33fea6] ring-1 ring-[#33fea6]' : ''}`}
                      />
                    </div>
                    <div className="flex">
                      <AlertDialog open={variableToDelete === variable.id} onOpenChange={(open) => !open && setVariableToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setVariableToDelete(variable.id)}
                            className="p-2 rounded-full hover:bg-[#33fea6]/20"
                            title="Delete variable"
                          >
                            <Trash className="w-4 h-4" />
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
                            <AlertDialogAction onClick={() => onDeleteVariable(variable.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            No variables available
          </div>
        )}
      </div>
    </>
  );
};
