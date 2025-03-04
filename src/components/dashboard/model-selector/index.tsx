
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Laptop } from 'lucide-react';
import { ModelTooltip } from './ModelTooltip';
import { ModelSelectorDialog } from './ModelSelectorDialog';
import { useModelSelector } from './useModelSelector';
import { ModelSelectorProps } from './types';

export const ModelSelector = ({ onSelect, isInitializingModels = false, selectedModel }: ModelSelectorProps) => {
  const { 
    sortedModels,
    loading,
    open,
    activeIndex,
    setActiveIndex,
    scrollDirection,
    setScrollDirection,
    isTransitioning,
    setIsTransitioning,
    isAnimating,
    setIsAnimating,
    handleDialogOpen,
    isLoading
  } = useModelSelector(selectedModel, onSelect, isInitializingModels);

  return (
    <div className="w-full mr-auto">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div>
          <div className="flex items-center">
            <Button 
              onClick={() => handleDialogOpen(true)}
              className="w-[30%] h-10 bg-[#fafafa] border border-[#084b49] text-[#545454] hover:bg-[#f0f0f0] flex justify-between items-center shadow-sm"
              variant="outline"
            >
              <span className="truncate">
                {selectedModel ? selectedModel.name : "Select AI model"}
              </span>
              <Laptop className="ml-2 h-4 w-4 text-[#084b49]" />
            </Button>
            
            {selectedModel && (
              <ModelTooltip model={selectedModel} />
            )}
          </div>
          
          <ModelSelectorDialog
            open={open}
            onOpenChange={handleDialogOpen}
            sortedModels={sortedModels}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            onSelect={onSelect}
            isTransitioning={isTransitioning}
            setIsTransitioning={setIsTransitioning}
            scrollDirection={scrollDirection}
            setScrollDirection={setScrollDirection}
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
          />
        </div>
      )}
    </div>
  );
};
