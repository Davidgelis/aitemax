
import { Plus, Check, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Variable } from "./types";
import { RefObject } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  // Group variables by category
  const groupedVariables: Record<string, Variable[]> = {};
  
  variables.forEach(variable => {
    const category = variable.category || 'Other';
    if (!groupedVariables[category]) {
      groupedVariables[category] = [];
    }
    groupedVariables[category].push(variable);
  });

  // Get all categories
  const categories = Object.keys(groupedVariables);

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
        {categories.length > 0 ? (
          categories.map((category) => (
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
                      onChange={(e) => onVariableChange(variable.id, 'value', e.target.value)}
                      className="flex-1 h-9"
                    />
                  </div>
                  <div className="flex gap-2">
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
                    
                    <button
                      onClick={() => onVariableRelevance(variable.id, true)}
                      className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                        variable.isRelevant === true ? 'bg-[#33fea6]/80' : ''
                      }`}
                      title="Keep variable"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
