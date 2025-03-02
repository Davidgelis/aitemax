
interface StepIndicatorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const StepIndicator = ({ currentStep, onStepChange }: StepIndicatorProps) => {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <button
        onClick={() => onStepChange(1)}
        className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
          currentStep === 1 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 1"
      />
      <button
        onClick={() => onStepChange(2)}
        className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
          currentStep === 2 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 2"
      />
      <button
        onClick={() => onStepChange(3)}
        className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
          currentStep === 3 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 3"
      />
    </div>
  );
};
