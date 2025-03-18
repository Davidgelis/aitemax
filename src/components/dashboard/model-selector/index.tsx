
import { Button } from '@/components/ui/button';
import { Laptop, HelpCircle } from 'lucide-react';
import { ModelTooltip } from './ModelTooltip';
import { ModelSelectorDialog } from './ModelSelectorDialog';
import { useModelSelector } from './useModelSelector';
import { ModelSelectorProps } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2 p-0 h-5 w-5 hover:bg-transparent"
                    aria-label={`Information about ${selectedModel.name}`}
                  >
                    <HelpCircle className="h-5 w-5 text-[#084b49]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  align="start" 
                  className="max-w-sm bg-white border border-[#084b49] p-4 rounded-md shadow-md"
                >
                  <div className="space-y-3">
                    {selectedModel.provider && <p className="text-sm text-[#545454]"><span className="font-medium">Provider:</span> {selectedModel.provider}</p>}
                    {selectedModel.description && <p className="text-sm text-[#545454]">{selectedModel.description}</p>}
                    
                    {selectedModel.strengths && selectedModel.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1 text-[#545454]">Strengths:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                          {selectedModel.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedModel.limitations && selectedModel.limitations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mt-2 mb-1 text-[#545454]">Limitations:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                          {selectedModel.limitations.map((limitation, i) => (
                            <li key={i}>{limitation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          hasNoneOption={true}
        />
      </div>
    </div>
  );
};
