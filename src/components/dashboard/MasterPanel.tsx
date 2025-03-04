
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { AIModel } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, RefreshCw, X, Edit } from 'lucide-react';

const MasterPanel = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
  const [newModel, setNewModel] = useState<Partial<AIModel>>({
    name: '',
    provider: '',
    description: '',
    strengths: [],
    limitations: []
  });
  const [newStrength, setNewStrength] = useState('');
  const [newLimitation, setNewLimitation] = useState('');
  const { toast } = useToast();
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [deleteConfirmModel, setDeleteConfirmModel] = useState<AIModel | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Check if current user is the master user
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

  // Fetch models
  const fetchModels = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('provider')
        .order('name');
      
      if (error) throw error;
      
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AI models",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMasterUser) {
      fetchModels();
    }
  }, [isMasterUser]);

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

      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          name: newModel.name,
          provider: newModel.provider,
          description: newModel.description,
          strengths: newModel.strengths,
          limitations: newModel.limitations
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI model added successfully",
      });

      setNewModel({
        name: '',
        provider: '',
        description: '',
        strengths: [],
        limitations: []
      });
      setIsAddModelOpen(false);
      fetchModels();
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
      
      const { error } = await supabase
        .from('ai_models')
        .update({
          name: currentModel.name,
          provider: currentModel.provider,
          description: currentModel.description,
          strengths: currentModel.strengths,
          limitations: currentModel.limitations
        })
        .eq('id', currentModel.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI model updated successfully",
      });

      setIsEditModelOpen(false);
      fetchModels();
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
    try {
      if (!deleteConfirmModel) return;
      
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', deleteConfirmModel.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI model deleted successfully",
      });
      
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmModel(null);
      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: "Error",
        description: "Failed to delete AI model",
        variant: "destructive"
      });
    }
  };

  const handleRefreshModels = async () => {
    try {
      setLoading(true);
      toast({
        title: "Refreshing",
        description: "Updating AI models...",
      });
      
      const response = await supabase.functions.invoke('update-ai-models', {
        method: 'POST',
        headers: {
          'X-Force-Update': 'true'
        }
      });

      if (response.error) throw response.error;
      
      console.log('Edge function response:', response.data);

      toast({
        title: "Success",
        description: "AI models refreshed successfully",
      });

      fetchModels();
    } catch (error) {
      console.error('Error refreshing models:', error);
      toast({
        title: "Error",
        description: "Failed to refresh AI models",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addStrength = () => {
    if (!newStrength.trim()) return;
    
    if (isEditModelOpen && currentModel) {
      setCurrentModel({
        ...currentModel,
        strengths: [...(currentModel.strengths || []), newStrength]
      });
    } else {
      setNewModel({
        ...newModel,
        strengths: [...(newModel.strengths || []), newStrength]
      });
    }
    setNewStrength('');
  };

  const addLimitation = () => {
    if (!newLimitation.trim()) return;
    
    if (isEditModelOpen && currentModel) {
      setCurrentModel({
        ...currentModel,
        limitations: [...(currentModel.limitations || []), newLimitation]
      });
    } else {
      setNewModel({
        ...newModel,
        limitations: [...(newModel.limitations || []), newLimitation]
      });
    }
    setNewLimitation('');
  };

  const removeStrength = (index: number) => {
    if (isEditModelOpen && currentModel) {
      const updatedStrengths = [...(currentModel.strengths || [])];
      updatedStrengths.splice(index, 1);
      setCurrentModel({
        ...currentModel,
        strengths: updatedStrengths
      });
    } else {
      const updatedStrengths = [...(newModel.strengths || [])];
      updatedStrengths.splice(index, 1);
      setNewModel({
        ...newModel,
        strengths: updatedStrengths
      });
    }
  };

  const removeLimitation = (index: number) => {
    if (isEditModelOpen && currentModel) {
      const updatedLimitations = [...(currentModel.limitations || [])];
      updatedLimitations.splice(index, 1);
      setCurrentModel({
        ...currentModel,
        limitations: updatedLimitations
      });
    } else {
      const updatedLimitations = [...(newModel.limitations || [])];
      updatedLimitations.splice(index, 1);
      setNewModel({
        ...newModel,
        limitations: updatedLimitations
      });
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
            disabled={loading}
            className="bg-[#084b49] hover:bg-[#084b49]/90 text-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Models
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
                <div>
                  <label className="text-sm font-medium text-[#545454]">Description</label>
                  <Textarea 
                    value={newModel.description || ''} 
                    onChange={(e) => setNewModel({...newModel, description: e.target.value})}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#545454]">Strengths</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={newStrength} 
                      onChange={(e) => setNewStrength(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addStrength()}
                      placeholder="Add strength and press Enter"
                    />
                    <Button type="button" onClick={addStrength} className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black">
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newModel.strengths?.map((strength, index) => (
                      <div key={index} className="bg-gray-100 rounded-md px-2 py-1 flex items-center text-[#545454]">
                        {strength}
                        <button 
                          onClick={() => removeStrength(index)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#545454]">Limitations</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={newLimitation} 
                      onChange={(e) => setNewLimitation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLimitation()}
                      placeholder="Add limitation and press Enter"
                    />
                    <Button type="button" onClick={addLimitation} className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black">
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newModel.limitations?.map((limitation, index) => (
                      <div key={index} className="bg-gray-100 rounded-md px-2 py-1 flex items-center text-[#545454]">
                        {limitation}
                        <button 
                          onClick={() => removeLimitation(index)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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
      
      {loading ? (
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

      {/* Edit Model Dialog */}
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
              <div>
                <label className="text-sm font-medium text-[#545454]">Description</label>
                <Textarea 
                  value={currentModel.description || ''} 
                  onChange={(e) => setCurrentModel({...currentModel, description: e.target.value})}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#545454]">Strengths</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={newStrength} 
                    onChange={(e) => setNewStrength(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStrength()}
                    placeholder="Add strength and press Enter"
                  />
                  <Button type="button" onClick={addStrength} className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black">
                    Add
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentModel.strengths?.map((strength, index) => (
                    <div key={index} className="bg-gray-100 rounded-md px-2 py-1 flex items-center text-[#545454]">
                      {strength}
                      <button 
                        onClick={() => removeStrength(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#545454]">Limitations</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={newLimitation} 
                    onChange={(e) => setNewLimitation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLimitation()}
                    placeholder="Add limitation and press Enter"
                  />
                  <Button type="button" onClick={addLimitation} className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black">
                    Add
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentModel.limitations?.map((limitation, index) => (
                    <div key={index} className="bg-gray-100 rounded-md px-2 py-1 flex items-center text-[#545454]">
                      {limitation}
                      <button 
                        onClick={() => removeLimitation(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
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

      {/* Delete Confirmation Dialog */}
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
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteModel}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterPanel;
