
interface StepIndicatorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  isViewingSavedPrompt?: boolean; // Add this new prop
}

export const StepIndicator = ({ currentStep, onStepChange, isViewingSavedPrompt = false }: StepIndicatorProps) => {
  return (
    <div className="flex flex-col items-center gap-4 mt-8 mb-4">
      {/* Numeric buttons for testing */}
      <div className="flex justify-center gap-4 mb-2">
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            onClick={() => !isViewingSavedPrompt || step === 3 ? onStepChange(step) : null}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 
              ${currentStep === step 
                ? 'bg-aurora animate-aurora text-white' 
                : isViewingSavedPrompt && step !== 3
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-card border text-card-foreground hover:bg-primary/20'
              }`}
            aria-label={`Jump to step ${step}`}
            disabled={isViewingSavedPrompt && step !== 3}
          >
            {step}
          </button>
        ))}
      </div>
      
      {/* Original dots */}
      <div className="flex justify-center gap-6">
        <button
          onClick={() => !isViewingSavedPrompt ? onStepChange(1) : null}
          className={`w-4 h-4 rounded-full transition-all duration-300 ${
            !isViewingSavedPrompt ? 'hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.175)]' : ''
          } relative ${
            currentStep === 1 
              ? 'bg-primary' 
              : isViewingSavedPrompt 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-border hover:bg-primary/50'
          }`}
          aria-label="Go to step 1"
          disabled={isViewingSavedPrompt}
        >
          <span className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full"></span>
        </button>
        <button
          onClick={() => !isViewingSavedPrompt ? onStepChange(2) : null}
          className={`w-4 h-4 rounded-full transition-all duration-300 ${
            !isViewingSavedPrompt ? 'hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.175)]' : ''
          } relative ${
            currentStep === 2 
              ? 'bg-primary' 
              : isViewingSavedPrompt 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-border hover:bg-primary/50'
          }`}
          aria-label="Go to step 2"
          disabled={isViewingSavedPrompt}
        >
          <span className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full"></span>
        </button>
        <button
          onClick={() => onStepChange(3)}
          className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-[0_0_10px_rgba(51,254,166,0.175)] relative ${
            currentStep === 3 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
          }`}
          aria-label="Go to step 3"
        >
          <span className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full"></span>
        </button>
      </div>
    </div>
  );
};
