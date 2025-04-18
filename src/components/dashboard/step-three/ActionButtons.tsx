
import { Button } from "@/components/ui/button";
import { Copy, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";

interface ActionButtonsProps {
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
}

export const ActionButtons = ({ handleCopyPrompt, handleSavePrompt }: ActionButtonsProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="outline"
        className="bg-white text-[#084b49]"
        onClick={handleCopyPrompt}
      >
        <Copy className="mr-2 h-4 w-4" />
        {t.finalPrompt.copyPrompt}
      </Button>
      <Button
        variant="aurora"
        className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
        onClick={handleSavePrompt}
      >
        <Save className="mr-2 h-4 w-4" />
        {t.finalPrompt.savePrompt}
      </Button>
    </div>
  );
};
