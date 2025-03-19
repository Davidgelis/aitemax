
import { useEffect, useRef, useState } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AIModel } from '../types';
import { DisplayModel } from './types';
import { useMemo } from 'react';
import { RectangleHorizontal } from "lucide-react";

interface ModelSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortedModels: AIModel[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  onSelect: (model: AIModel | null) => void;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
  scrollDirection: 'up' | 'down' | null;
  setScrollDirection: (direction: 'up' | 'down' | null) => void;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  hasNoneOption?: boolean;
}

export const ModelSelectorDialog = ({
  open,
  onOpenChange,
  sortedModels,
  activeIndex,
  setActiveIndex,
  onSelect,
  isTransitioning,
  setIsTransitioning,
  scrollDirection,
  setScrollDirection,
  isAnimating,
  setIsAnimating,
  hasNoneOption = true
}: ModelSelectorDialogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const displayModelsArray = useMemo(() => {
    if (hasNoneOption) {
      return [
        { 
          id: 'none', 
          name: '-', 
          provider: 'None',
          description: 'No model selected',
          strengths: [],
          limitations: []
        } as AIModel,
        ...sortedModels
      ];
    }
    return sortedModels;
  }, [sortedModels, hasNoneOption]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setIsAnimating(true);
    
    if (e.deltaY > 0) {
      setScrollDirection('down');
      setActiveIndex((prev) => {
        const next = prev >= displayModelsArray.length - 1 ? 0 : prev + 1;
        if (next === 0) {
          onSelect(null);
        } else {
          onSelect(displayModelsArray[next]);
        }
        return next;
      });
    } else {
      setScrollDirection('up');
      setActiveIndex((prev) => {
        const next = prev <= 0 ? displayModelsArray.length - 1 : prev - 1;
        if (next === 0) {
          onSelect(null);
        } else {
          onSelect(displayModelsArray[next]);
        }
        return next;
      });
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
      setScrollDirection(null);
      setIsAnimating(false);
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
      setIsAnimating(true);
      setScrollDirection('down');
      setActiveIndex((prev) => {
        const next = prev >= displayModelsArray.length - 1 ? 0 : prev + 1;
        if (next === 0) {
          onSelect(null);
        } else {
          onSelect(displayModelsArray[next]);
        }
        return next;
      });
      setTimeout(() => {
        setIsTransitioning(false);
        setScrollDirection(null);
        setIsAnimating(false);
      }, 700);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsTransitioning(true);
      setIsAnimating(true);
      setScrollDirection('up');
      setActiveIndex((prev) => {
        const next = prev <= 0 ? displayModelsArray.length - 1 : prev - 1;
        if (next === 0) {
          onSelect(null);
        } else {
          onSelect(displayModelsArray[next]);
        }
        return next;
      });
      setTimeout(() => {
        setIsTransitioning(false);
        setScrollDirection(null);
        setIsAnimating(false);
      }, 700);
    } else if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      handleSelectModel(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  const handleSelectModel = (selectedIndex: number) => {
    setActiveIndex(selectedIndex);
    if (selectedIndex === 0 && hasNoneOption) {
      onSelect(null);
    } else {
      onSelect(displayModelsArray[selectedIndex]);
    }
    onOpenChange(false);
  };

  const getDisplayModels = (): DisplayModel[] => {
    if (displayModelsArray.length === 0) return [];
    
    const displayCount = 5;
    const halfCount = Math.floor(displayCount / 2);
    
    let displayModels = [];
    
    for (let i = -halfCount; i <= halfCount; i++) {
      let index = activeIndex + i;
      
      if (index < 0) index = displayModelsArray.length + index;
      if (index >= displayModelsArray.length) index = index - displayModelsArray.length;
      
      displayModels.push({
        model: displayModelsArray[index],
        position: i,
        index
      });
    }
    
    return displayModels;
  };

  const getTransitionClass = (position: number) => {
    if (isAnimating) {
      if (position === 0) {
        return 'transition-all duration-700 ease-in-out transform';
      }
      
      if (scrollDirection === 'up') {
        return position < 0 
          ? 'transition-all duration-700 ease-in-out transform delay-50'
          : 'transition-all duration-700 ease-in-out transform';
      } else if (scrollDirection === 'down') {
        return position > 0 
          ? 'transition-all duration-700 ease-in-out transform delay-50'
          : 'transition-all duration-700 ease-in-out transform';
      }
    }
    
    return 'transition-all duration-700 ease-in-out transform';
  };

  useEffect(() => {
    if (open) {
      setupWheelListener();
      window.addEventListener('keydown', handleKeyDown);
      
      if (scrollRef.current) {
        scrollRef.current.focus();
      }
      
      setTimeout(() => {
        setupWheelListener();
      }, 100);
      
      return () => {
        if (scrollRef.current) {
          scrollRef.current.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, displayModelsArray.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 max-w-md w-full h-[300px] flex items-center justify-center bg-transparent border-none shadow-none overflow-visible"
        overlayClassName="backdrop-blur-sm bg-black/60"
      >
        <DialogTitle className="sr-only">
          <VisuallyHidden>Select AI Model</VisuallyHidden>
        </DialogTitle>
        
        <DialogDescription className="sr-only">
          Use mouse wheel or arrow keys to navigate through AI models
        </DialogDescription>
        
        <div 
          ref={scrollRef}
          className="relative h-full w-full flex flex-col items-center justify-center cursor-pointer overflow-visible"
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              onOpenChange(false);
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
                transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => handleSelectModel(index)}
              role="option"
              aria-selected={position === 0}
            >
              <div
                className={`text-center px-6 py-2 whitespace-nowrap font-bold transition-all duration-700 ease-in-out`}
                style={{
                  // Always use non-selected color (#b2b2b2) for the dash, regardless of position
                  color: model.name === '-' ? '#b2b2b2' : position === 0 ? '#33fea6' : '#b2b2b2',
                  fontSize: position === 0 ? '1.875rem' : '1.25rem',
                  fontWeight: 700,
                  letterSpacing: position === 0 ? '0.5px' : 'normal',
                  transform: `scale(${position === 0 ? 1.05 : 1})`,
                  transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(model.name === '-' ? {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0.5rem',
                  } : {})
                }}
              >
                {model.name === '-' ? (
                  <div className="flex justify-center items-center">
                    <div 
                      className="w-16 h-3 rounded-md"
                      style={{ 
                        // Always use non-selected color (#b2b2b2) for the dash, regardless of position
                        backgroundColor: '#b2b2b2',
                      }}
                    />
                  </div>
                ) : (
                  model.name
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
