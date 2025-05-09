
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";
import { Button } from "@/components/ui/button";

interface StepIndicatorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  isViewingSavedPrompt?: boolean;
  isLoading?: boolean;
  onAnalyze?: () => void;
  promptText?: string;
}

export const StepIndicator = ({ 
  currentStep, 
  onStepChange,
  isViewingSavedPrompt = false,
  isLoading = false,
  onAnalyze,
  promptText = ""
}: StepIndicatorProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  // Calculate opacity based on whether prompt text exists
  const buttonOpacity = promptText.trim() ? '100%' : '0%';

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return t.steps.step1Label;
      case 2:
        return t.steps.step2Label;
      case 3:
        return t.steps.step3Label;
      default:
        return `${t.steps.step} ${step}`;
    }
  };

  const getStepAriaLabel = (step: number): string => {
    switch (step) {
      case 1:
        return t.steps.step1AriaLabel;
      case 2:
        return t.steps.step2AriaLabel;
      case 3:
        return t.steps.step3AriaLabel;
      default:
        return `${t.steps.step} ${step}`;
    }
  };

  return (
    <div className="mt-2 flex flex-col items-center">
      {/* Analyze button on top for step 1 */}
      {currentStep === 1 && onAnalyze && (
        <div className="mb-1 w-[40%] relative z-10 -mt-5">
          <Button
            onClick={onAnalyze}
            disabled={isLoading || !promptText.trim()}
            variant="aurora"
            className="shadow-md px-8 py-2 w-full transition-opacity duration-300"
            style={{ opacity: buttonOpacity }}
          >
            {isLoading ? t.steps.analyzing : t.prompts.analyze}
          </Button>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center space-x-2 bg-[#f8f9fa] px-4 py-2 rounded-full">
        <button
          onClick={() => onStepChange(1)}
          className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium ${
            currentStep === 1
              ? "bg-[#33fea6] text-black"
              : "text-[#545454] hover:bg-[#e5e7eb]"
          }`}
          aria-label={getStepAriaLabel(1)}
          aria-current={currentStep === 1 ? "step" : undefined}
          aria-disabled={isViewingSavedPrompt}
          title={getStepLabel(1)}
        >
          1
        </button>
        <div className="h-[2px] w-4 bg-[#e5e7eb]"></div>
        <button
          onClick={() => onStepChange(2)}
          className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium ${
            currentStep === 2
              ? "bg-[#33fea6] text-black"
              : "text-[#545454] hover:bg-[#e5e7eb]"
          }`}
          aria-label={getStepAriaLabel(2)}
          aria-current={currentStep === 2 ? "step" : undefined}
          aria-disabled={isViewingSavedPrompt}
          title={getStepLabel(2)}
        >
          2
        </button>
        <div className="h-[2px] w-4 bg-[#e5e7eb]"></div>
        <button
          onClick={() => onStepChange(3)}
          className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium ${
            currentStep === 3
              ? "bg-[#33fea6] text-black"
              : "text-[#545454] hover:bg-[#e5e7eb]"
          }`}
          aria-label={getStepAriaLabel(3)}
          aria-current={currentStep === 3 ? "step" : undefined}
          title={getStepLabel(3)}
        >
          3
        </button>
      </div>
    </div>
  );
};
