
import React from 'react';
import { ActionButtons } from './ActionButtons';
import { FinalPromptDisplay } from './FinalPromptDisplay';
import { MasterCommandSection } from '../MasterCommandSection';

interface StepThreeProps {
  masterCommand: string;
  finalPrompt: string;
  onBack: () => void;
}

export const StepThree = ({ masterCommand, finalPrompt, onBack }: StepThreeProps) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Your Enhanced Prompt</h2>
        <p className="text-[#545454]">Review your enhanced prompt, make any final adjustments, and use it in your preferred AI platform.</p>
      </div>

      <div className="border rounded-xl p-6 bg-card">
        <FinalPromptDisplay finalPrompt={finalPrompt} />
        
        <div className="mt-6">
          <ActionButtons 
            finalPrompt={finalPrompt}
            onBack={onBack}
          />
        </div>
      </div>
    </div>
  );
};
