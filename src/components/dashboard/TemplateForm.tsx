
import { useState, useEffect } from "react";
import { PillarConfig, PromptTemplate } from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, X, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface TemplateFormProps {
  template?: PromptTemplate;
  onSave: (template: Omit<PromptTemplate, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const TemplateForm = ({ template, onSave, onCancel }: TemplateFormProps) => {
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [systemPrefix, setSystemPrefix] = useState(template?.systemPrefix || "");
  const [pillars, setPillars] = useState<PillarConfig[]>(template?.pillars || []);
  const [maxChars, setMaxChars] = useState<number>(template?.maxChars || 4000);
  const [temperature, setTemperature] = useState<number>(
    template?.temperature !== undefined ? template.temperature : 0.7
  );
  
  // Function to add a new pillar
  const addPillar = () => {
    setPillars([
      ...pillars,
      {
        name: "",
        description: "",
        order: pillars.length,
        required: true
      }
    ]);
  };
  
  // Function to update a pillar
  const updatePillar = (index: number, field: keyof PillarConfig, value: any) => {
    const updatedPillars = [...pillars];
    updatedPillars[index] = {
      ...updatedPillars[index],
      [field]: value
    };
    setPillars(updatedPillars);
  };
  
  // Function to remove a pillar
  const removePillar = (index: number) => {
    const updatedPillars = pillars.filter((_, i) => i !== index);
    // Update order for remaining pillars
    updatedPillars.forEach((pillar, i) => {
      pillar.order = i;
    });
    setPillars(updatedPillars);
  };
  
  // Move pillar up in order
  const movePillarUp = (index: number) => {
    if (index === 0) return;
    const updatedPillars = [...pillars];
    [updatedPillars[index - 1], updatedPillars[index]] = [updatedPillars[index], updatedPillars[index - 1]];
    // Update order properties
    updatedPillars.forEach((pillar, i) => {
      pillar.order = i;
    });
    setPillars(updatedPillars);
  };
  
  // Move pillar down in order
  const movePillarDown = (index: number) => {
    if (index === pillars.length - 1) return;
    const updatedPillars = [...pillars];
    [updatedPillars[index], updatedPillars[index + 1]] = [updatedPillars[index + 1], updatedPillars[index]];
    // Update order properties
    updatedPillars.forEach((pillar, i) => {
      pillar.order = i;
    });
    setPillars(updatedPillars);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    
    if (pillars.some(p => !p.name.trim())) {
      alert("All pillars must have a name");
      return;
    }
    
    onSave({
      title,
      description,
      systemPrefix,
      pillars,
      maxChars,
      temperature
    });
  };
  
  // Add default pillars if none exist
  useEffect(() => {
    if (pillars.length === 0) {
      setPillars([
        {
          name: "Task",
          description: "Define the specific objective that needs to be accomplished",
          order: 0,
          required: true
        },
        {
          name: "Persona",
          description: "Specify the role or personality the AI should adopt",
          order: 1,
          required: true
        },
        {
          name: "Conditions",
          description: "Outline constraints, requirements, and context",
          order: 2,
          required: true
        },
        {
          name: "Instructions",
          description: "Provide detailed steps for completion",
          order: 3,
          required: true
        }
      ]);
    }
  }, []);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template Title"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this template is for"
          />
        </div>
        
        <div>
          <Label htmlFor="systemPrefix">System Prefix</Label>
          <Textarea
            id="systemPrefix"
            value={systemPrefix}
            onChange={(e) => setSystemPrefix(e.target.value)}
            placeholder="Instructions for the AI about how to handle the prompt"
            className="min-h-[100px]"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Pillars</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addPillar}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Pillar
            </Button>
          </div>
          
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-3">
              {pillars.map((pillar, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-2 cursor-grab flex flex-col items-center gap-1">
                        <button 
                          type="button" 
                          onClick={() => movePillarUp(index)}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <button 
                          type="button" 
                          onClick={() => movePillarDown(index)}
                          disabled={index === pillars.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label htmlFor={`pillar-name-${index}`} className="text-xs">Name</Label>
                          <Input
                            id={`pillar-name-${index}`}
                            value={pillar.name}
                            onChange={(e) => updatePillar(index, 'name', e.target.value)}
                            placeholder="Pillar Name"
                            required
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`pillar-desc-${index}`} className="text-xs">Description</Label>
                          <Textarea
                            id={`pillar-desc-${index}`}
                            value={pillar.description}
                            onChange={(e) => updatePillar(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePillar(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {pillars.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No pillars defined. Add some using the button above.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
            <span className="text-sm text-muted-foreground">
              {temperature < 0.4 ? "More focused" : temperature > 0.7 ? "More creative" : "Balanced"}
            </span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.1}
            value={[temperature]}
            onValueChange={(value) => setTemperature(value[0])}
          />
        </div>
        
        <div>
          <Label htmlFor="maxChars">Max Characters: {maxChars}</Label>
          <Slider
            id="maxChars"
            min={1000}
            max={10000}
            step={500}
            value={[maxChars]}
            onValueChange={(value) => setMaxChars(value[0])}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum number of characters for the enhanced prompt
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="aurora">
          {template ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
};
