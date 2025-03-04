import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ModelService } from '@/services/ModelService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Laptop } from 'lucide-react';
import { AIModel } from './types';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
  selectedModel: AIModel | null;
}

export const ModelSelector = ({ onSelect, isInitializingModels = false, selectedModel }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [providers, setProviders] = useState<string[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (e.deltaY > 0) {
      setScrollDirection('down');
      setActiveIndex(prev => {
        const next = prev >= sortedModels.length - 1 ? 0 : prev + 1;
        if (sortedModels[next]) {
          onSelect(sortedModels[next]);
        }
        return next;
      });
    } else {
      setScrollDirection('up');
      setActiveIndex(prev => {
        const next = prev <= 0 ? sortedModels.length - 1 : prev - 1;
        if (sortedModels[next]) {
          onSelect(sortedModels[next]);
        }
        return next;
      });
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
      setScrollDirection(null);
    }, 700);
  };

  const setupWheelListener = () => {
    const scrollContainer = scrollRef.current;
    
    if (scrollContainer) {
      scrollContainer.removeEventListener('wheel', handleWheel);
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      console.log('Wheel event listener set up on model selector');
    } else {
      console.warn('Could not set up wheel event, container ref is null');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open || isTransitioning) return;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setIsTransitioning(true);
      setScrollDirection('down');
      setActiveIndex(prev => {
        const next = prev >= sortedModels.length - 1 ? 0 : prev + 1;
        if (sortedModels[next]) {
          onSelect(sortedModels[next]);
        }
        return next;
      });
      setTimeout(() => {
        setIsTransitioning(false);
        setScrollDirection(null);
      }, 700);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsTransitioning(true);
      setScrollDirection('up');
      setActiveIndex(prev => {
        const next = prev <= 0 ? sortedModels.length - 1 : prev - 1;
        if (sortedModels[next]) {
          onSelect(sortedModels[next]);
        }
        return next;
      });
      setTimeout(() => {
        setIsTransitioning(false);
        setScrollDirection(null);
      }, 700);
    } else if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      handleSelectModel(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const modelList = await ModelService.fetchModels();
      setModels(modelList);
      
      const providerList = await ModelService.getProviders();
      setProviders(providerList);
      
      console.log(`Fetched ${modelList.length} models from ${providerList.length} providers`);
      
      if (selectedModel) {
        const index = modelList.findIndex(model => model.id === selectedModel.id);
        if (index !== -1) {
          setActiveIndex(index);
        }
      }
      
      toast({
        title: "AI Models Loaded",
        description: `${modelList.length} AI models from ${providerList.length} providers have been loaded.`,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      toast({
        title: "Error fetching models",
        description: "Could not load AI models.",
        variant: "destructive"
      });
      setLoading(false);
      setModels([]);
      setProviders([]);
    }
  };

  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  useEffect(() => {
    fetchModels();
    
    const intervalId = setInterval(() => {
      console.log('Checking for model updates (daily polling)');
      fetchModels();
    }, 86400000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isInitializingModels && loading) {
      fetchModels();
    }
  }, [isInitializingModels]);

  useEffect(() => {
    if (open) {
      setupWheelListener();
      window.addEventListener('keydown', handleKeyDown);
      if (scrollRef.current) {
        scrollRef.current.focus();
      }
      
      return () => {
        if (scrollRef.current) {
          scrollRef.current.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, sortedModels.length]);

  useEffect(() => {
    if (open) {
      setupWheelListener();
    }
  }, [models, open]);

  const handleSelectModel = (selectedIndex: number) => {
    setActiveIndex(selectedIndex);
    onSelect(sortedModels[selectedIndex]);
    setOpen(false);
  };

  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    setIsTransitioning(false);
    setScrollDirection(null);
    
    if (isOpen && selectedModel) {
      const index = sortedModels.findIndex(model => model.id === selectedModel.id);
      if (index !== -1) {
        setActiveIndex(index);
      }
      setTimeout(() => {
        setupWheelListener();
      }, 100);
    }
  };

  const isLoading = loading || isInitializingModels;

  const getDisplayModels = () => {
    if (sortedModels.length === 0) return [];
    
    const displayCount = 5;
    const halfCount = Math.floor(displayCount / 2);
    
    let displayModels = [];
    
    for (let i = -halfCount; i <= halfCount; i++) {
      let index = activeIndex + i;
      
      if (index < 0) index = sortedModels.length + index;
      if (index >= sortedModels.length) index = index - sortedModels.length;
      
      displayModels.push({
        model: sortedModels[index],
        position: i,
        index
      });
    }
    
    return displayModels;
  };

  const getTransitionClass = (position: number) => {
    if (position === 0) return 'transition-all duration-700 ease-in-out';
    
    if (scrollDirection === 'up') {
      return position < 0 
        ? 'transition-all duration-700 ease-in-out delay-50'
        : 'transition-all duration-700 ease-in-out';
    } else if (scrollDirection === 'down') {
      return position > 0 
        ? 'transition-all duration-700 ease-in-out delay-50'
        : 'transition-all duration-700 ease-in-out';
    }
    
    return 'transition-all duration-700 ease-in-out';
  };

  return (
    <div className="w-full mr-auto">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div>
          <Button 
            onClick={() => handleDialogOpen(true)}
            className="w-full h-10 bg-[#fafafa] border border-[#084b49] text-[#545454] hover:bg-[#f0f0f0] flex justify-between items-center"
            variant="outline"
          >
            <span className="truncate">
              {selectedModel ? selectedModel.name : "Select AI model"}
            </span>
            <Laptop className="ml-2 h-4 w-4 text-[#084b49]" />
          </Button>
          
          <Dialog open={open} onOpenChange={handleDialogOpen}>
            <DialogContent 
              className="p-0 max-w-md w-full h-[300px] flex items-center justify-center bg-transparent border-none shadow-none"
              overlayClassName="backdrop-blur-sm bg-black/60"
              transparent={true}
            >
              <DialogTitle className="sr-only">
                <VisuallyHidden>Select AI Model</VisuallyHidden>
              </DialogTitle>
              
              <div 
                ref={scrollRef}
                className="relative h-full w-full flex flex-col items-center justify-center cursor-pointer"
                onClick={(e) => {
                  if (e.currentTarget === e.target) {
                    setOpen(false);
                  }
                }}
                tabIndex={0}
                role="listbox"
                aria-label="AI Models"
              >
                {getDisplayModels().map(({ model, position, index }) => (
                  <div
                    key={`${model.id}-${position}`}
                    className={`absolute select-none ${getTransitionClass(position)}`}
                    style={{
                      transform: `translateY(${position * 60}px) scale(${1 - Math.abs(position) * 0.15})`,
                      opacity: 1 - Math.abs(position) * 0.25,
                      zIndex: 10 - Math.abs(position),
                    }}
                    onClick={() => handleSelectModel(index)}
                    role="option"
                    aria-selected={position === 0}
                  >
                    <div
                      className={`text-center px-6 py-2 whitespace-nowrap transition-all duration-700 ease-in-out font-bold`}
                      style={{
                        color: position === 0 ? '#33fea6' : '#b2b2b2',
                        fontSize: position === 0 ? '1.875rem' : '1.25rem',
                        fontWeight: 600,
                        letterSpacing: position === 0 ? '0.5px' : 'normal',
                        transform: `scale(${position === 0 ? 1.05 : 1})`,
                        filter: position === 0 ? 'drop-shadow(0 0 8px rgba(51, 254, 166, 0.5))' : 'none'
                      }}
                    >
                      {model.name}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          {selectedModel && (
            <div className="mt-4 p-4 bg-background border border-[#084b49] rounded-md">
              <div className="space-y-3">
                <h3 className="font-medium text-lg text-[#545454]">{selectedModel.name}</h3>
                {selectedModel.provider && <p className="text-sm text-[#545454]">Provider: {selectedModel.provider}</p>}
                {selectedModel.description && <p className="text-sm text-[#545454]">{selectedModel.description}</p>}
                
                {selectedModel.strengths && selectedModel.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Strengths:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                      {selectedModel.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedModel.limitations && selectedModel.limitations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Limitations:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                      {selectedModel.limitations.map((limitation, i) => (
                        <li key={i}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
