
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";

interface StepIndicatorProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  isViewingSavedPrompt?: boolean;
}

export const StepIndicator = ({ 
  currentStep, 
  onStepChange,
  isViewingSavedPrompt = false
}: StepIndicatorProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <div className="mt-8 flex justify-center">
      <div className="flex items-center space-x-2 bg-[#f8f9fa] px-4 py-2 rounded-full">
        <button
          onClick={() => onStepChange(1)}
          className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium ${
            currentStep === 1
              ? "bg-[#33fea6] text-black"
              : "text-[#545454] hover:bg-[#e5e7eb]"
          }`}
          aria-disabled={isViewingSavedPrompt}
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
          aria-disabled={isViewingSavedPrompt}
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
        >
          3
        </button>
      </div>
    </div>
  );
};
