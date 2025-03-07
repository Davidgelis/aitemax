
import { Switch } from "@/components/ui/switch";
import { primaryToggles, secondaryToggles } from "../constants";

interface ToggleSectionProps {
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
}

export const ToggleSection = ({
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  showJson,
  setShowJson
}: ToggleSectionProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-1.5">
          {primaryToggles.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
              <div className="flex items-center">
                <span className="text-xs">{item.label}</span>
                {item.definition && (
                  <div className="ml-1">
                    <div className="group relative inline-block">
                      <button className="text-card-foreground hover:text-[#33fea6] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                          <path d="M12 17h.01"/>
                        </svg>
                      </button>
                      <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-64 p-2 bg-white border rounded-md shadow-lg z-10 text-xs">
                        {item.definition}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Switch
                checked={selectedPrimary === item.id}
                onCheckedChange={() => handlePrimaryToggle(item.id)}
                className="scale-75"
                variant="primary"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {secondaryToggles.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
              <div className="flex items-center">
                <span className="text-xs">{item.label}</span>
                {item.definition && (
                  <div className="ml-1">
                    <div className="group relative inline-block">
                      <button className="text-card-foreground hover:text-[#33fea6] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                          <path d="M12 17h.01"/>
                        </svg>
                      </button>
                      <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-64 p-2 bg-white border rounded-md shadow-lg z-10 text-xs">
                        {item.definition}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Switch
                checked={selectedSecondary === item.id}
                onCheckedChange={() => handleSecondaryToggle(item.id)}
                className="scale-75"
                variant="secondary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">JSON Toggle view</span>
        <Switch
          checked={showJson}
          onCheckedChange={setShowJson}
          className="scale-75"
        />
      </div>
    </>
  );
};
