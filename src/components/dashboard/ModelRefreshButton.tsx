
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useModels } from "@/context/ModelContext";
import { cn } from "@/lib/utils";

interface ModelRefreshButtonProps {
  className?: string;
}

export const ModelRefreshButton: React.FC<ModelRefreshButtonProps> = ({ className }) => {
  const { refreshModels, isLoading } = useModels();
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => refreshModels()}
      disabled={isLoading}
      className={cn("gap-1", className)}
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      {isLoading ? "Refreshing..." : "Refresh Models"}
    </Button>
  );
};
