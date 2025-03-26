
import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { GripVertical, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PillarType, TemplateType } from "./XTemplateCard";

interface TemplateEditorProps {
  template?: TemplateType;
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(template?.name || "");
  const [role, setRole] = useState(template?.role || "");
  const [pillars, setPillars] = useState<PillarType[]>(
    template?.pillars || [
      { id: "1", title: "Task", description: "Define the specific task or goal to be accomplished." },
      { id: "2", title: "Persona", description: "Specify the role, voice, and style the AI should adopt." },
    ]
  );
  const [temperature, setTemperature] = useState<number[]>([template?.temperature || 0.7]);
  const [draggedPillar, setDraggedPillar] = useState<number | null>(null);

  const handleAddPillar = () => {
    if (pillars.length >= 8) {
      toast({
        title: "Maximum pillars reached",
        description: "You can have a maximum of 8 pillars per template.",
        variant: "destructive"
      });
      return;
    }
    
    const newId = (Math.max(...pillars.map(p => parseInt(p.id)), 0) + 1).toString();
    setPillars([...pillars, { id: newId, title: "New Pillar", description: "Describe this pillar" }]);
  };

  const handleRemovePillar = (id: string) => {
    setPillars(pillars.filter(p => p.id !== id));
  };

  const handlePillarChange = (id: string, field: 'title' | 'description', value: string) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDragStart = (index: number) => {
    setDraggedPillar(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPillar === null) return;
    
    if (draggedPillar !== index) {
      const newPillars = [...pillars];
      const draggedItem = newPillars[draggedPillar];
      newPillars.splice(draggedPillar, 1);
      newPillars.splice(index, 0, draggedItem);
      
      setPillars(newPillars);
      setDraggedPillar(index);
    }
  };

  const handleSave = () => {
    // This would save the template in a real implementation
    toast({
      title: template ? "Template updated" : "Template created",
      description: template ? "Your changes have been saved." : "Your new template has been created."
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{template ? "Edit Template" : "Create New Template"}</DialogTitle>
        <DialogDescription>
          Customize your system message structure with a role definition and up to 8 pillars.
          Drag and drop pillars to reorder them.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g., Professional Business Writer"
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="role">Role Definition</Label>
          <Textarea 
            id="role" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            placeholder="Define the role the AI should assume..."
            className="mt-1.5 min-h-[100px]"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <Label>Pillars ({pillars.length}/8)</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPillar} disabled={pillars.length >= 8}>
              <Plus className="h-4 w-4 mr-1" />
              Add Pillar
            </Button>
          </div>
          
          <div className="space-y-3">
            {pillars.map((pillar, index) => (
              <Card 
                key={pillar.id}
                className="p-4 border-dashed hover:border-solid hover:border-[#64bf95]"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-2 cursor-grab">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 grid gap-3">
                    <div>
                      <Label htmlFor={`pillar-title-${pillar.id}`} className="text-xs">Title</Label>
                      <Input 
                        id={`pillar-title-${pillar.id}`}
                        value={pillar.title}
                        onChange={(e) => handlePillarChange(pillar.id, 'title', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`pillar-desc-${pillar.id}`} className="text-xs">Description</Label>
                      <Textarea 
                        id={`pillar-desc-${pillar.id}`}
                        value={pillar.description}
                        onChange={(e) => handlePillarChange(pillar.id, 'description', e.target.value)}
                        className="mt-1 min-h-[80px]"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemovePillar(pillar.id)}
                    disabled={pillars.length <= 1}
                    className="mt-2 text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="temperature">Temperature: {temperature[0].toFixed(1)}</Label>
          <Slider
            id="temperature"
            value={temperature}
            onValueChange={setTemperature}
            min={0}
            max={1}
            step={0.1}
            className="mt-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>More Deterministic (0.0)</span>
            <span>More Creative (1.0)</span>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave}>
          {template ? "Save Changes" : "Create Template"}
        </Button>
      </DialogFooter>
    </>
  );
};
