
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface DraftStatusProps {
  isDirty: boolean;
  isSaving: boolean;
  onSaveDraft: () => void;
}

export const DraftStatus = ({ isDirty, isSaving, onSaveDraft }: DraftStatusProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <div className="flex items-center gap-2">
      {isDirty && (
        <button
          onClick={onSaveDraft}
          className="text-xs flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
        >
          <Save className="h-3 w-3" />
          {t.userActions.saveDraft}
        </button>
      )}
      
      {isSaving && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1">
          <span>{t.userActions.saving}</span>
        </Badge>
      )}
      
      {!isDirty && !isSaving && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
          <span>{t.userActions.allChangesSaved}</span>
        </Badge>
      )}
    </div>
  );
};
