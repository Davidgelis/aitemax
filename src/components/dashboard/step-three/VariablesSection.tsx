
import React from 'react';
import { Variable } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VariablesSectionProps {
  variables: Variable[];
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  onDeleteVariable: (variableId: string) => void;  // Updated signature to expect variableId
}

export const VariablesSection = ({ 
  variables, 
  handleVariableValueChange,
  onDeleteVariable 
}: VariablesSectionProps) => {
  if (!variables || variables.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Variables</CardTitle>
        <CardDescription>
          Adjust variables to customize your prompt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{variable.name || 'Variable'}</div>
                <button 
                  onClick={() => onDeleteVariable(variable.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <input
                type="text"
                value={variable.value || ''}
                onChange={(e) => handleVariableValueChange(variable.id, e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter value..."
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
