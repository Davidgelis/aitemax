
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Edit, Trash2, Eye, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { TemplateEditor } from "./TemplateEditor";
import { useToast } from "@/hooks/use-toast";
import { deleteTemplate } from "./XTemplatesList";
import { PROTECTED_TEMPLATE_IDS } from "@/components/dashboard/constants";

export interface PillarType {
  id: string;
  title: string;
  description: string;
}

export interface TemplateType {
  id: string;
  name: string;
  role: string;
  pillars: PillarType[];
  temperature: number;
  characterLimit?: number;
  isDefault?: boolean;
  createdAt: string;
}

interface XTemplateCardProps {
  template: TemplateType;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const XTemplateCard = ({ template, isSelected = false, onSelect }: XTemplateCardProps) => {
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(false);
  
  // Update the check to use PROTECTED_TEMPLATE_IDS
  const isProtected = PROTECTED_TEMPLATE_IDS.includes(template.id);

  const handleDelete = () => {
    // Delete the template using the global event
    deleteTemplate(template.id);
    
    toast({
      title: "Template deleted",
      description: "The template has been successfully deleted."
    });
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template.id);
    }
  };

  return (
    <Card 
      className={`group hover:scale-[1.01] transition-all overflow-hidden bg-white border-[1.5px] ${
        isSelected ? "border-[#33fea6] shadow-[0_0_10px_rgba(51,254,166,0.3)]" : "border-[#64bf95]"
      } shadow-md relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-[#33fea6] text-black">Default</Badge>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          <div className="mb-3">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground">{template.createdAt}</p>
          </div>
          
          {/* Role Definition section is now hidden */}
          
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Pillars:</p>
            <div className="flex flex-wrap gap-2">
              {template.pillars.slice(0, 3).map((pillar, index) => (
                <Badge key={index} variant="outline" className="bg-[#64bf95]/10">
                  {pillar.title}
                </Badge>
              ))}
              {template.pillars.length > 3 && (
                <Badge variant="outline" className="bg-[#64bf95]/10">
                  +{template.pillars.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Temperature: {template.temperature}</p>
          </div>
          
          {/* Action Buttons */}
          <div className={`flex justify-between transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
            <div className="flex gap-1">
              {/* "Set Default" button removed */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">Created on {template.createdAt}</p>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Template Role:</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">{template.role}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Pillars:</h4>
                      <div className="space-y-3">
                        {template.pillars.map((pillar) => (
                          <div key={pillar.id} className="bg-gray-50 p-3 rounded-md">
                            <div className="font-medium text-[#084b49]">{pillar.title}</div>
                            <div className="text-sm mt-1">{pillar.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-sm font-medium">Temperature:</span>
                      <Badge variant="outline" className="bg-[#64bf95]/10">
                        {template.temperature}
                      </Badge>
                    </div>
                    
                    {template.characterLimit && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Character Limit:</span>
                        <Badge variant="outline" className="bg-[#64bf95]/10">
                          {template.characterLimit}
                        </Badge>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {!isProtected && (
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                    <TemplateEditor template={template} />
                  </DialogContent>
                </Dialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the template. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                      <AlertDialogCancel className="border-[#8E9196] text-[#8E9196]">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-[#ea384c] hover:bg-[#ea384c]/90" onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
