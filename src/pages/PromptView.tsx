
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavedPrompt, Variable } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePromptOperations } from "@/hooks/usePromptOperations";
import { FinalPromptDisplay } from "@/components/dashboard/step-three/FinalPromptDisplay";
import { ToggleSection } from "@/components/dashboard/step-three/ToggleSection";
import { ActionButtons } from "@/components/dashboard/step-three/ActionButtons";
import { VariablesSection } from "@/components/dashboard/step-three/VariablesSection";
import XPanelButton from "@/components/dashboard/XPanelButton";

const PromptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Step 3 state variables
  const [finalPrompt, setFinalPrompt] = useState("");
  const [masterCommand, setMasterCommand] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [isRefreshingJson, setIsRefreshingJson] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [editablePrompt, setEditablePrompt] = useState("");
  const [showEditPromptSheet, setShowEditPromptSheet] = useState(false);
  const [lastSavedPrompt, setLastSavedPrompt] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPrompt(id);
    }
  }, [id, user]);

  const fetchPrompt = async (promptId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        toast({
          title: "Prompt not found",
          description: "The prompt you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/x-panel");
        return;
      }
      
      const formattedPrompt: SavedPrompt = {
        id: data.id,
        title: data.title || 'Untitled Prompt',
        date: new Date(data.created_at || '').toLocaleString(),
        promptText: data.prompt_text || '',
        masterCommand: data.master_command || '',
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        variables: data.variables ? JSON.parse(JSON.stringify(data.variables)) : [],
        tags: (data.tags as unknown as Array<{category: string, subcategory: string}>) || []
      };
      
      setPrompt(formattedPrompt);
      setFinalPrompt(formattedPrompt.promptText);
      setMasterCommand(formattedPrompt.masterCommand);
      setVariables(formattedPrompt.variables || []);
      setLastSavedPrompt(formattedPrompt.promptText);
      setIsOwner(user && data.user_id === user.id);
      
    } catch (error: any) {
      console.error("Error fetching prompt:", error.message);
      toast({
        title: "Error fetching prompt",
        description: error.message,
        variant: "destructive",
      });
      navigate("/x-panel");
    } finally {
      setIsLoading(false);
    }
  };

  // Get the promptOperations utilities
  const promptOperations = usePromptOperations(
    variables,
    setVariables,
    finalPrompt,
    setFinalPrompt,
    showJson,
    setEditingPrompt,
    setShowEditPromptSheet,
    masterCommand,
    editingPrompt
  );

  // Handler functions from prompt operations
  const getProcessedPrompt = useCallback(() => {
    return promptOperations.getProcessedPrompt();
  }, [promptOperations]);

  const handleVariableValueChange = useCallback((variableId: string, newValue: string) => {
    promptOperations.handleVariableValueChange(variableId, newValue);
  }, [promptOperations]);
  
  const handleCopyPrompt = useCallback(() => {
    promptOperations.handleCopyPrompt();
  }, [promptOperations]);

  const handleSavePrompt = useCallback(async () => {
    try {
      if (!prompt?.id) return;
      
      const { error } = await supabase
        .from('prompts')
        .update({
          prompt_text: finalPrompt,
          master_command: masterCommand,
          variables: variables
        })
        .eq('id', prompt.id);
      
      if (error) throw error;
      
      toast({
        title: "Prompt saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving prompt:", error.message);
      toast({
        title: "Error saving prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [finalPrompt, masterCommand, variables, prompt?.id, toast]);

  const handleOpenEditPrompt = useCallback(() => {
    if (typeof promptOperations.handleOpenEditPrompt === 'function') {
      promptOperations.handleOpenEditPrompt();
    }
  }, [promptOperations]);

  const handleSaveEditedPrompt = useCallback(() => {
    if (typeof promptOperations.handleSaveEditedPrompt === 'function') {
      promptOperations.handleSaveEditedPrompt();
    }
  }, [promptOperations]);

  const handleRefreshJson = useCallback(() => {
    if (isRefreshingJson) return;
    
    setIsRefreshingJson(true);
    toast({
      title: "Refreshing JSON",
      description: "Updating JSON structure with current content...",
    });
    
    setTimeout(() => {
      setRenderTrigger(prev => prev + 1);
      setIsRefreshingJson(false);
    }, 100);
  }, [toast, isRefreshingJson]);

  const handleDeleteVariable = useCallback((variableId: string) => {
    if (typeof promptOperations.handleDeleteVariable === 'function') {
      promptOperations.handleDeleteVariable(variableId);
    }
  }, [promptOperations]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Prompt not found</h2>
          <Button variant="default" onClick={() => navigate("/x-panel")}>
            Go to X Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <XPanelButton />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/x-panel")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{prompt.title}</h1>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
          {/* Input for Master Command */}
          <div className="flex items-center gap-3 mb-3">
            <input
              value={masterCommand}
              onChange={(e) => setMasterCommand(e.target.value)}
              placeholder="Master command, use it to adapt the prompt to any other similar needs"
              className="flex-1 h-8 text-sm p-2 border rounded"
            />
          </div>

          {/* Toggle section for JSON view */}
          <ToggleSection 
            showJson={showJson}
            setShowJson={setShowJson}
            refreshJson={handleRefreshJson}
            isRefreshing={isRefreshingJson}
          />

          {/* Prompt display with editing capabilities */}
          <FinalPromptDisplay 
            finalPrompt={finalPrompt}
            updateFinalPrompt={setFinalPrompt}
            getProcessedPrompt={getProcessedPrompt}
            variables={variables}
            setVariables={setVariables}
            showJson={showJson}
            masterCommand={masterCommand}
            handleOpenEditPrompt={handleOpenEditPrompt}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editablePrompt={editablePrompt}
            setEditablePrompt={setEditablePrompt}
            handleSaveEditedPrompt={handleSaveEditedPrompt}
            renderTrigger={renderTrigger}
            setRenderTrigger={setRenderTrigger}
            isRefreshing={isRefreshingJson}
            setIsRefreshing={setIsRefreshingJson}
            lastSavedPrompt={lastSavedPrompt}
            setLastSavedPrompt={setLastSavedPrompt}
          />

          {/* Variables section */}
          <VariablesSection 
            variables={variables} 
            handleVariableValueChange={handleVariableValueChange}
            onDeleteVariable={handleDeleteVariable}
          />

          {/* Action buttons for copy/save */}
          <ActionButtons 
            handleCopyPrompt={handleCopyPrompt}
            handleSavePrompt={handleSavePrompt}
          />
        </div>
      </div>
    </div>
  );
};

export default PromptView;
