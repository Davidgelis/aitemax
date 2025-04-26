import { Plus, Trash } from "lucide-react";
import { Variable } from "./types";
import { RefObject, useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { filterCategoryVariables } from "./constants";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface VariableListProps {
  variables: Variable[];
  onVariableChange: (variableId: string, field: keyof Variable, content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: () => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt: string;
}

export const VariableList = ({
  variables,
  onVariableChange,
  onVariableRelevance,
  onAddVariable,
  onDeleteVariable,
  variableToDelete,
  setVariableToDelete,
  containerRef,
  originalPrompt
}: VariableListProps) => {
  // Track which variables have values to highlight them
  const [highlightedVariables, setHighlightedVariables] = useState<Record<string, boolean>>({});
  const [variableNames, setVariableNames] = useState<Record<string, string>>({});
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [variableCodes, setVariableCodes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const maxCharacterLimit = 100; // Set character limit to 100
  
  // Filter out category names and empty names for display
  const filteredVariables = filterCategoryVariables(variables).filter(v => v.name.trim() !== '');
  
  // Group variables by category
  const groupedVariables: Record<string, Variable[]> = {};
  
  variables.forEach(variable => {
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

  // Initialize state from props
  useEffect(() => {
    const names: Record<string, string> = {};
    const values: Record<string, string> = {};
    const codes: Record<string, string> = {};
    const highlighted: Record<string, boolean> = {};
    
    variables.forEach((variable, index) => {
      names[variable.id] = variable.name || '';
      values[variable.id] = variable.value || '';
      codes[variable.id] = variable.code || `VAR_${index + 1}`;
      highlighted[variable.id] = variable.value && variable.value.trim() !== '';
      
      // Auto-set relevance based on value
      if (variable.value && variable.value.trim() !== '' && variable.isRelevant === null) {
        onVariableRelevance(variable.id, true);
      }
      
      // Ensure every variable has a code
      if (!variable.code) {
        onVariableChange(variable.id, 'code' as keyof Variable, `VAR_${index + 1}`);
      }
    });
    
    setVariableNames(names);
    setVariableValues(values);
    setVariableCodes(codes);
    setHighlightedVariables(highlighted);
  }, [variables]);

  // Handle variable value change with highlighting
  const handleValueChange = (variableId: string, value: string) => {
    // Update local state
    setVariableValues(prev => ({
      ...prev,
      [variableId]: value
    }));
    
    setHighlightedVariables(prev => ({
      ...prev,
      [variableId]: value.trim() !== ''
    }));
    
    // Mark as relevant when value is added
    if (value.trim() !== '') {
      onVariableRelevance(variableId, true);
    }
    
    // Call the original change handler
    onVariableChange(variableId, 'value', value);
  };

  // Handle name change
  const handleNameChange = (variableId: string, name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length > 3) {
      toast({
        title: "Name too long",
        description: "Variable names must be 1-3 words.",
        variant: "warning"
      });
      name = words.slice(0, 3).join(' ');
    }
    
    // Update local state
    setVariableNames(prev => ({
      ...prev,
      [variableId]: name
    }));
    
    // Call the original change handler
    onVariableChange(variableId, 'name', name);
  };
  
  // Handle code change
  const handleCodeChange = (variableId: string, code: string) => {
    // Update local state
    setVariableCodes(prev => ({
      ...prev,
      [variableId]: code
    }));
    
    // Call the original change handler
    onVariableChange(variableId, 'code' as keyof Variable, code);
  };

  // Handle delete (marking as not relevant)
  const handleDelete = (id: string) => {
    console.log(`Marking variable ${id} as not relevant`);
    // Always mark as not relevant before removing
    onVariableRelevance(id, false);
    
    // Add a small delay to ensure state updates before removing
    setTimeout(() => {
      onDeleteVariable();
    }, 50);
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
        {!hasValidVariables && variables.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No variables available
          </div>
        )}
        
        {variables.length > 0 && (
          <div className="space-y-3">
            {variables.map((variable, index) => (
              <div key={variable.id} className="flex gap-3 items-center">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="Variable name (1-3 words)"
                    value={variableNames[variable.id] || ""}
                    onChange={(e) => handleNameChange(variable.id, e.target.value)}
                    className="flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6]"
                    autoComplete="off"
                    aria-label={`Name for variable ${index + 1}`}
                  />
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Value"
                      value={variableValues[variable.id] || ""}
                      onChange={(e) => {
                        // Limit input to maxCharacterLimit characters
                        if (e.target.value.length <= maxCharacterLimit) {
                          handleValueChange(variable.id, e.target.value);
                        }
                      }}
                      className={`flex-1 h-9 px-3 py-1 rounded-md border text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#33fea6] focus:border-[#33fea6] pr-16 ${
                        highlightedVariables[variable.id] ? 'border-[#33fea6] ring-1 ring-[#33fea6]' : ''
                      }`}
                      autoComplete="off"
                      aria-label={`Value for ${variable.name || 'variable'} ${index + 1}`}
                      maxLength={maxCharacterLimit}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      {(variableValues[variable.id] || "").length}/{maxCharacterLimit}
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <AlertDialog open={variableToDelete === variable.id} onOpenChange={(open) => !open && setVariableToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => {
                          setVariableToDelete(variable.id);
                        }}
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
                        <AlertDialogAction onClick={() => handleDelete(variable.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
