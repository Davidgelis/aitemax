
import React from 'react';

interface StepThreeStylesProps {
  children: React.ReactNode;
}

export const StepThreeStyles: React.FC<StepThreeStylesProps> = ({ children }) => {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};
