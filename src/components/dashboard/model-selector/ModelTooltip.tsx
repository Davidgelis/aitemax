
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AIModel } from '../types';

interface ModelTooltipProps {
  model: AIModel;
}

export const ModelTooltip = ({ model }: ModelTooltipProps) => (
  <TooltipProvider>
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-2 p-0 h-5 w-5 hover:bg-transparent"
          aria-label={`Information about ${model.name}`}
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
          {model.provider && <p className="text-sm text-[#545454]"><span className="font-medium">Provider:</span> {model.provider}</p>}
          {model.description && <p className="text-sm text-[#545454]">{model.description}</p>}
          
          {model.strengths && model.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-[#545454]">Strengths:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                {model.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
          )}
          
          {model.limitations && model.limitations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mt-2 mb-1 text-[#545454]">Limitations:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                {model.limitations.map((limitation, i) => (
                  <li key={i}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
