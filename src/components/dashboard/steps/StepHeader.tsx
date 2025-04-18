
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface StepHeaderProps {
  step: number;
  isViewingSavedPrompt: boolean;
}

export const StepHeader = ({ step, isViewingSavedPrompt }: StepHeaderProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  const getStepLabel = () => {
    switch (step) {
      case 1:
        return t.steps.step1;
      case 2:
        return t.steps.step2;
      case 3:
        return t.steps.step3;
      default:
        return '';
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-semibold">
        {getStepLabel()}
      </h2>
      {!isViewingSavedPrompt && (
        <button 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => history.back()}
        >
          {t.backToDashboard}
        </button>
      )}
    </div>
  );
};
