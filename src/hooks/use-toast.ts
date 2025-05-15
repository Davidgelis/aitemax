
import { toast as sonnerToast, type Toast } from "@/components/ui/toast";

export type ToastProps = Toast

export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

export { sonnerToast as toast };
