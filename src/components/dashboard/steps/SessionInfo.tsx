
import { Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface SessionInfoProps {
  sessionTimer: string;
  refreshSession: () => void;
  isSessionAboutToExpire: boolean;
}

export const SessionInfo = ({ 
  sessionTimer, 
  refreshSession, 
  isSessionAboutToExpire 
}: SessionInfoProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <div className="text-xs flex items-center gap-1">
      <Clock className="h-3 w-3" />
      <span className={isSessionAboutToExpire ? "text-red-500" : "text-muted-foreground"}>
        {t.userActions.session}: {sessionTimer}
      </span>
      <button 
        onClick={refreshSession}
        className="text-xs text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
        title={t.userActions.refreshSession}
      >
        <RefreshCw className="h-3 w-3" />
      </button>
    </div>
  );
};
