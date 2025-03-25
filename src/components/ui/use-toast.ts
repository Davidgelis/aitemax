
// This file simply re-exports from the hooks directory
import { useToast as useToastHook, toast } from "@/hooks/use-toast";

// Re-export with the same names
export const useToast = useToastHook;
export { toast };
