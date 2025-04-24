
import { Variable } from "./types";
import { RefObject, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, AlertTriangle, Info, Edit } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface VariableListProps {
  variables: Variable[];
  onVariableChange: (variableId: string, field: keyof Variable, value: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: () => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt?: string;
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
  // Ensure variables is an array and filter out only relevant ones
  const safeVariables = Array.isArray(variables) ? variables : [];
  const relevantVariables = safeVariables.filter(v => v && v.isRelevant !== false);
  
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [editVariableSheet, setEditVariableSheet] = useState(false);
  const [variableName, setVariableName] = useState("");
  const [variableValue, setVariableValue] = useState("");

  const handleEditVariable = (variable: Variable) => {
    if (!variable) return;
    
    setEditingVariable(variable);
    setVariableName(variable.name || "");
    setVariableValue(variable.value || "");
    setEditVariableSheet(true);
    
    // Automatically mark as relevant when editing
    if (variable.isRelevant === null) {
      onVariableRelevance(variable.id, true);
    }
  };

  const handleSaveVariable = () => {
    if (editingVariable) {
      onVariableChange(editingVariable.id, 'name', variableName);
      onVariableChange(editingVariable.id, 'value', variableValue);
      
      // Close the editing sheet
      setEditVariableSheet(false);
      setEditingVariable(null);
    }
  };

  const handleToggleRelevance = (variableId: string, currentIsRelevant: boolean | null) => {
    const newRelevance = currentIsRelevant === false ? true : false;
    onVariableRelevance(variableId, newRelevance);
  };

  // Helper to safely access translation keys
  const getTranslation = (key: string, fallback: string): string => {
    const parts = key.split('.');
    let result: any = t;
    
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return fallback;
      }
    }
    
    return typeof result === 'string' ? result : fallback;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{getTranslation('steps.variablesTitle', 'Variables')}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{getTranslation('steps.variablesTooltip', 'Custom variables that can be used in your prompt')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button 
          onClick={onAddVariable}
          className="flex items-center gap-1 text-sm bg-accent/10 hover:bg-accent/20 p-2 rounded-md transition-colors"
          title={getTranslation('steps.addNewVariable', 'Add New Variable')}
        >
          <Plus className="h-4 w-4" />
          <span>{getTranslation('steps.addNew', 'Add New')}</span>
        </button>
      </div>
      
      <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2">
        {relevantVariables.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-gray-50/50 text-muted-foreground">
            <p className="text-center text-sm mb-2">{getTranslation('steps.noVariables', 'No variables defined yet')}</p>
            <button 
              onClick={onAddVariable}
              className="flex items-center gap-1 text-sm bg-accent/10 hover:bg-accent/20 p-2 rounded-md transition-colors mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>{getTranslation('steps.createFirstVariable', 'Create your first variable')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {relevantVariables.map((variable) => {
              // Skip rendering if variable is invalid
              if (!variable || !variable.id) return null;
              
              const hasName = variable.name && variable.name.trim() !== "";
              const hasValue = variable.value && variable.value.trim() !== "";
              const isComplete = hasName && hasValue;
              
              return (
                <div key={variable.id} className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-grow flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/10 transition-colors group"
                      onClick={() => handleEditVariable(variable)}
                    >
                      <div className={`flex flex-col gap-1 ${!isComplete ? 'opacity-70' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">
                            {hasName ? variable.name : getTranslation('steps.unnamed', 'Unnamed')}
                          </span>
                          {!isComplete && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getTranslation('steps.incompleteVariable', 'This variable is incomplete')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Edit className="w-4 h-4 opacity-0 group-hover:opacity-80 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {hasValue ? variable.value : getTranslation('steps.noValue', 'No value set')}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setVariableToDelete(variable.id)}
                      className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                      title={getTranslation('steps.delete', 'Delete')}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!variableToDelete} onOpenChange={(open) => !open && setVariableToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation('steps.confirmDelete', 'Confirm Delete')}</DialogTitle>
          </DialogHeader>
          <p>{getTranslation('steps.deleteWarning', 'Are you sure you want to delete this variable? This action cannot be undone.')}</p>
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 border rounded-md">{getTranslation('steps.cancel', 'Cancel')}</button>
            </DialogClose>
            <button 
              onClick={() => {
                onDeleteVariable();
                setVariableToDelete(null);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {getTranslation('steps.delete', 'Delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Variable Editing Sheet */}
      <Sheet open={editVariableSheet} onOpenChange={(open) => {
        if (!open) {
          handleSaveVariable();
        }
        setEditVariableSheet(open);
      }}>
        <SheetContent className="w-[90%] sm:max-w-[500px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>{getTranslation('steps.editVariable', 'Edit Variable')}</SheetTitle>
            <SheetDescription>
              {getTranslation('steps.editVariableDescription', 'Edit your variable name and value here')}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="variable-name" className="text-sm font-medium">
                {getTranslation('steps.name', 'Name')}
              </label>
              <input
                id="variable-name"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                placeholder={getTranslation('steps.namePlaceholder', 'Enter variable name')}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="variable-value" className="text-sm font-medium">
                {getTranslation('steps.value', 'Value')}
              </label>
              <textarea
                id="variable-value"
                value={variableValue}
                onChange={(e) => setVariableValue(e.target.value)}
                placeholder={getTranslation('steps.valuePlaceholder', 'Enter variable value')}
                rows={4}
                className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveVariable}
                className="aurora-button"
              >
                {getTranslation('steps.save', 'Save')}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
