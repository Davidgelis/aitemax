
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
}

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
}

export function ModelSelector({ onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selected, setSelected] = useState<AIModel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      toast({
        title: "Error fetching models",
        description: "Failed to load AI models list",
        variant: "destructive",
      });
    }
  };

  const handleSelect = (model: AIModel) => {
    setSelected(model);
    setOpen(false);
    onSelect(model);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.name : "Select an AI model..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search models..." />
          </div>
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandGroup>
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={model.name}
                onSelect={() => handleSelect(model)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected?.id === model.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{model.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {model.provider}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
