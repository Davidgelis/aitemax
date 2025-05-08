
import React from 'react';
import { useTemplateManagement } from '@/hooks/useTemplateManagement';
import { templatePillarsMap } from './templatePillars';

export const TemplatePillarDebugger = () => {
  const { currentTemplate, systemState } = useTemplateManagement();
  
  // Check if the current template is using specialized pillars
  const hasSpecializedPillars = systemState.subId && templatePillarsMap[systemState.subId];
  const specializedConfig = hasSpecializedPillars ? templatePillarsMap[systemState.subId] : null;
  
  return (
    <div className="p-4 border rounded-md bg-gray-50 my-4 text-sm">
      <h3 className="font-medium mb-2">Template Debug Info</h3>
      <div className="space-y-1">
        <p><span className="font-medium">Current Template:</span> {currentTemplate?.name}</p>
        <p><span className="font-medium">Selected Sub-ID:</span> {systemState.subId || 'None'}</p>
        <p><span className="font-medium">Has Specialized Pillars:</span> {hasSpecializedPillars ? 'Yes' : 'No'}</p>
        
        {specializedConfig && (
          <>
            <p><span className="font-medium">Specialized Role:</span> {specializedConfig.role?.substring(0, 50)}...</p>
            <p><span className="font-medium">Specialized Temperature:</span> {specializedConfig.temperature}</p>
          </>
        )}
        
        <p><span className="font-medium">Pillars:</span></p>
        <ul className="list-disc pl-5">
          {currentTemplate?.pillars.map(pillar => (
            <li key={pillar.id}>{pillar.title} - {pillar.description?.substring(0, 40)}...</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
