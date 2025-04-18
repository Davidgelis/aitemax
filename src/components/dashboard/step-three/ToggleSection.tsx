
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

interface ToggleSectionProps {
  refreshJson?: () => void;
  isRefreshing?: boolean;
  showRefreshButton?: boolean;
}

export const ToggleSection = ({
  refreshJson,
  isRefreshing = false,
  showRefreshButton = false
}: ToggleSectionProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { currentLanguage } = useLanguage();
  const { currentTemplate } = useTemplateManagement();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  
  // Handle refresh with debounce to prevent multiple clicks
  const handleRefresh = () => {
    if (!isRefreshing && !isButtonDisabled && refreshJson) {
      setIsButtonDisabled(true);
      refreshJson();
      
      // Re-enable the button after a short delay
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    }
  };
  
  // Reset disabled state when refreshing completes
  useEffect(() => {
    if (!isRefreshing) {
      setIsButtonDisabled(false);
    }
  }, [isRefreshing]);

  return (
    <div className="flex items-center gap-2 mb-3">
      {showRefreshButton && refreshJson && (
        <Button 
          onClick={handleRefresh}
          variant="ghost" 
          size="xs"
          className="ml-1 p-1 h-6 w-6"
          title={t.steps.toggleSections.jsonLoadingTitle}
          disabled={isRefreshing || isButtonDisabled}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">{t.steps.toggleSections.tryAgain}</span>
        </Button>
      )}
      {currentTemplate && (
        <div className="text-sm text-muted-foreground">
          Using template: {currentTemplate.name}
        </div>
      )}
    </div>
  );
};
