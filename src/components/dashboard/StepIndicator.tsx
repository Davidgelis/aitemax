
interface StepIndicatorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const StepIndicator = ({ currentStep, onStepChange }: StepIndicatorProps) => {
  return (
    <div className="flex justify-center gap-6 mt-8 mb-4">
      <button
        onClick={() => onStepChange(1)}
        className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.7)] ${
          currentStep === 1 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 1"
      />
      <button
        onClick={() => onStepChange(2)}
        className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.7)] ${
          currentStep === 2 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 2"
      />
      <button
        onClick={() => onStepChange(3)}
        className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.7)] ${
          currentStep === 3 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
        }`}
        aria-label="Go to step 3"
      />
    </div>
  );
};
