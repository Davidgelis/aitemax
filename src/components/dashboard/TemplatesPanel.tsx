
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { TemplateForm } from "@/components/dashboard/TemplateForm";
import { PromptTemplate } from "@/components/dashboard/types";
import { usePromptTemplates } from "@/hooks/usePromptTemplates";

interface TemplatesPanelProps {
  userId: string | undefined;
  onSelectTemplate: (templateId: string | null) => void;
}

export const TemplatesPanel = ({ userId, onSelectTemplate }: TemplatesPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | undefined>();
  
  const {
    templates,
    isLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  } = usePromptTemplates(userId);
  
  // Filter templates by search term
  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group templates by default and custom
  const defaultTemplates = filteredTemplates.filter(t => t.isDefault);
  const customTemplates = filteredTemplates.filter(t => !t.isDefault);
  
  // Handle template selection
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    onSelectTemplate(id);
  };
  
  // Handle template edit
  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };
  
  // Handle template save
  const handleSaveTemplate = async (templateData: Omit<PromptTemplate, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>) => {
    if (editingTemplate) {
      // Update existing template
      await updateTemplate(editingTemplate.id, templateData);
    } else {
      // Create new template
      const newTemplate = await createTemplate(templateData);
      if (newTemplate) {
        handleSelectTemplate(newTemplate.id);
      }
    }
    setShowForm(false);
    setEditingTemplate(undefined);
  };
  
  // Handle form cancel
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTemplate(undefined);
  };
  
  // Create a new blank template
  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setShowForm(true);
  };
  
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button variant="aurora" onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#64bf95]"></div>
              </div>
            ) : (
              <>
                {/* Default Templates */}
                {defaultTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Default Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {defaultTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplateId === template.id}
                          onSelect={handleSelectTemplate}
                          onEdit={handleEditTemplate}
                          onDuplicate={duplicateTemplate}
                          onDelete={deleteTemplate}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Templates */}
                {customTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Your Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplateId === template.id}
                          onSelect={handleSelectTemplate}
                          onEdit={handleEditTemplate}
                          onDuplicate={duplicateTemplate}
                          onDelete={deleteTemplate}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <p className="text-muted-foreground">No templates match your search.</p>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">No templates available.</p>
                        <Button variant="outline" onClick={handleCreateTemplate}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Your First Template
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Template Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>{editingTemplate ? "Edit Template" : "Create Template"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={handleCancelForm}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
