
import { useState } from "react";
import { Copy, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PromptTemplate } from "@/components/dashboard/types";

interface TemplateCardProps {
  template: PromptTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (template: PromptTemplate) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete
}: TemplateCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Format pillar names for display
  const pillarNames = template.pillars
    .sort((a, b) => a.order - b.order)
    .map(p => p.name)
    .join(", ");
    
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 ${
        isSelected 
          ? "border-2 border-[#64bf95] shadow-[0_0_15px_rgba(100,191,149,0.3)]" 
          : "hover:scale-[1.02] hover:shadow-md border border-border"
      }`}
      onClick={() => onSelect(template.id)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {template.isDefault && (
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              )}
              <h3 className="font-medium text-lg">{template.title}</h3>
            </div>
            
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}
            
            <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-2">
              <span className="bg-[#64bf95]/10 px-2 py-0.5 rounded-full">
                {pillarNames || "No pillars defined"}
              </span>
              <span className="bg-[#64bf95]/10 px-2 py-0.5 rounded-full">
                Temp: {template.temperature}
              </span>
            </div>
          </div>
          
          <div className={`transition-opacity duration-300 ${isHovering || isSelected ? 'opacity-100' : 'opacity-0'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!template.isDefault && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(template.id);
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                
                {!template.isDefault && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(template.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
