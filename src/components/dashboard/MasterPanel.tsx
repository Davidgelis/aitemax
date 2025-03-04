
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useModels } from "@/context/ModelContext";
import { AIModel } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Edit } from 'lucide-react';

const MasterPanel = () => {
  const { models, isLoading, refreshModels, addModel, updateModel, deleteModel } = useModels();
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
  const [newModel, setNewModel] = useState<Partial<AIModel>>({
    name: '',
    provider: ''
  });
  const { toast } = useToast();
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [deleteConfirmModel, setDeleteConfirmModel] = useState<AIModel | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const checkMasterUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === '8b40d73f-fffb-411f-9044-480773968d58') {
          setIsMasterUser(true);
        }
      } catch (error) {
        console.error('Error checking master user:', error);
      }
    };

    checkMasterUser();
  }, []);

  const handleAddModel = async () => {
    try {
      if (!newModel.name || !newModel.provider) {
        toast({
          title: "Missing Information",
          description: "Model name and provider are required",
          variant: "destructive"
        });
        return;
      }

      const result = await addModel({
        name: newModel.name,
        provider: newModel.provider
      });

      if (result) {
        setNewModel({
          name: '',
          provider: ''
        });
        setIsAddModelOpen(false);
      }
    } catch (error) {
      console.error('Error adding model:', error);
      toast({
        title: "Error",
        description: "Failed to add AI model",
        variant: "destructive"
      });
    }
  };

  const handleUpdateModel = async () => {
    try {
      if (!currentModel || !currentModel.id) return;
      
      const success = await updateModel(currentModel.id, {
        name: currentModel.name,
        provider: currentModel.provider
      });

      if (success) {
        setIsEditModelOpen(false);
        toast({
          title: "Success",
          description: "AI model updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating model:', error);
      toast({
        title: "Error",
        description: "Failed to update AI model",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteModel = (model: AIModel) => {
    setDeleteConfirmModel(model);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteModel = async () => {
    if (!deleteConfirmModel || !deleteConfirmModel.id) {
      toast({
        title: "Error",
        description: "No model selected for deletion",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log(`MasterPanel: Starting deletion process for model ID: ${deleteConfirmModel.id}, name: ${deleteConfirmModel.name}`);
      
      const modelName = deleteConfirmModel.name;
      const modelId = deleteConfirmModel.id;
      
      // Adding a console log to track the deleteModel call
      console.log(`MasterPanel: Calling deleteModel on ModelContext with ID: ${modelId}`);
      
      const result = await deleteModel(modelId);
        
      if (result) {
        console.log(`MasterPanel: Delete operation successful for model ${modelId}`);
        setIsDeleteConfirmOpen(false);
        setDeleteConfirmModel(null);
        
        // Display success toast but this will also be shown by the context
        toast({
          title: "Model Deleted",
          description: `Model "${modelName}" has been successfully removed`,
        });
        
        // Force refresh models to ensure UI is in sync with database
        setTimeout(() => {
          refreshModels();
        }, 1000);
      } else {
        console.error(`MasterPanel: Delete operation failed for model ${modelId}`);
        toast({
          title: "Deletion Failed",
          description: "Could not delete model from the database. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('MasterPanel: Delete operation error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      toast({
        title: "Deletion Failed",
        description: `Could not delete model: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshModels = async () => {
    try {
      setIsRefreshing(true);
      await refreshModels();
      toast({
        title: "Models Refreshed",
        description: "AI models have been successfully refreshed.",
      });
    } catch (error) {
      console.error('Error refreshing models:', error);
      toast({
        title: "Error",
        description: "Failed to refresh AI models. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isMasterUser) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#545454]">Master AI Model Panel</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefreshModels} 
            disabled={isLoading || isRefreshing}
            className="bg-[#084b49] hover:bg-[#084b49]/90 text-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
            {isRefreshing ? 'Refreshing...' : 'Refresh Models'}
          </Button>
          <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black">
                <Plus className="mr-2 h-4 w-4" /> Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle className="text-[#545454]">Add New AI Model</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium text-[#545454]">Model Name</label>
                  <Input 
                    value={newModel.name} 
                    onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#545454]">Provider</label>
                  <Input 
                    value={newModel.provider || ''} 
                    onChange={(e) => setNewModel({...newModel, provider: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Other model details like description, strengths, and limitations will be generated automatically.</p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModelOpen(false)}
                  className="border-gray-300 text-[#545454]"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddModel}
                  className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
                >
                  Add Model
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {isLoading ? (
        <div className="py-10 text-center text-[#545454]">Loading models...</div>
      ) : (
        <div className="grid gap-4 mt-4">
          {models.length === 0 ? (
            <div className="py-10 text-center text-[#545454]">No AI models found</div>
          ) : (
            models.map((model) => (
              <div 
                key={model.id} 
                className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-[#545454]">{model.name}</h3>
                    <p className="text-sm text-[#545454] opacity-80">Provider: {model.provider}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setCurrentModel(model);
                        setIsEditModelOpen(true);
                      }}
                      className="border-gray-300 text-[#545454]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => confirmDeleteModel(model)}
                      className="border-red-200 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {model.description && (
                  <p className="mt-2 text-sm text-[#545454]">{model.description}</p>
                )}
                <div className="mt-3">
                  {model.strengths && model.strengths.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs text-gray-500 uppercase">Strengths</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.strengths.map((strength, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {model.limitations && model.limitations.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs text-gray-500 uppercase">Limitations</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.limitations.map((limitation, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                            {limitation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isEditModelOpen} onOpenChange={setIsEditModelOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#545454]">Edit AI Model</DialogTitle>
          </DialogHeader>
          {currentModel && (
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium text-[#545454]">Model Name</label>
                <Input 
                  value={currentModel.name} 
                  onChange={(e) => setCurrentModel({...currentModel, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#545454]">Provider</label>
                <Input 
                  value={currentModel.provider || ''} 
                  onChange={(e) => setCurrentModel({...currentModel, provider: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p>Other model details like description, strengths, and limitations will be updated automatically.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditModelOpen(false)}
              className="border-gray-300 text-[#545454]"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateModel}
              className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
            >
              Update Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#545454]">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#545454]">
              Are you sure you want to delete the model "{deleteConfirmModel?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="border-gray-300 text-[#545454]"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteModel}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterPanel;
