
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface PrivacyNoticePopupProps {
  user: any;
  currentStep: number;
}

export const PrivacyNoticePopup = ({ user, currentStep }: PrivacyNoticePopupProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || currentStep !== 1) return;

    // Check if the user has already seen the notice
    const hasSeenNotice = localStorage.getItem(`privacy-notice-seen-${user.id}`);
    
    if (!hasSeenNotice) {
      setOpen(true);
      // Mark as seen
      localStorage.setItem(`privacy-notice-seen-${user.id}`, 'true');
    }
  }, [user, currentStep]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Privacy Notice</h3>
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Your input information and final prompt will remain confidential within Aitema X and will not be shared externally or with any third parties.
        </p>
      </DialogContent>
    </Dialog>
  );
};
