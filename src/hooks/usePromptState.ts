
import { useState, useEffect, useCallback } from "react";
import { Question, Variable, SavedPrompt, variablesToJson, jsonToVariables, PromptJsonStructure, PromptTag } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { defaultVariables, mockQuestions } from "@/components/dashboard/constants";
import { supabase } from "@/integrations/supabase/client";
import { usePromptDrafts } from "@/hooks/usePromptDrafts";
import { Json } from "@/integrations/supabase/types";
import { useLocation } from "react-router-dom";

export const usePromptState = (user?: any) => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [masterCommand, setMasterCommand] = useState<string>('');
  const [primaryToggle, setPrimaryToggle] = useState<string | null>(null);
  const [secondaryToggle, setSecondaryToggle] = useState<string | null>(null);
  const [finalPrompt, setFinalPrompt] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  const [showEditPromptSheet, setShowEditPromptSheet] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [variables, setVariables] = useState<Variable[]>(defaultVariables);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [tags, setTags] = useState<PromptTag[]>([]);
  const [jsonStructure, setJsonStructure] = useState<PromptJsonStructure | null>(null);
  const [selectedTag, setSelectedTag] = useState<PromptTag | null>(null);
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isTemplate, setIsTemplate] = useState<boolean>(false);
  const [isForked, setIsForked] = useState<boolean>(false);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isArchived, setIsArchived] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [isShortening, setIsShortening] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);
  const [isElaborating, setIsElaborating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isRevising, setIsRevising] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [isUnarchiving, setIsUnarchiving] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isUnsharing, setIsUnsharing] = useState<boolean>(false);
  const [isFavoriting, setIsFavoriting] = useState<boolean>(false);
  const [isUnfavoriting, setIsUnfavoriting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isUploading, setIsLoadingUploading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [isViewingSavedPrompt, setIsViewingSavedPrompt] = useState<boolean>(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fetchPromptError, setFetchPromptError] = useState<Error | null>(null);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(false);
  
  // Use the usePromptDrafts hook to manage drafts - Fixed call to match parameters needed
  const { 
    drafts, 
    saveDraft, 
    loadSelectedDraft, 
    deleteDraft: handleDeleteDraft,
    isLoadingDrafts: isDraftsLoading,
    currentDraftId: draftId,
    isDirty: draftIsDirty,
    isSaving: draftIsSaving
  } = usePromptDrafts(
    promptText,
    masterCommand,
    variables,
    primaryToggle,
    secondaryToggle,
    currentStep,
    user
  );

  // Fetch saved prompts from the database
  const fetchSavedPrompts = async () => {
    if (!user) return;
    
    setIsLoadingPrompts(true);
    setFetchPromptError(null);
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching prompts:", error);
        setFetchPromptError(error);
        return;
      }
      
      if (data) {
        const formattedPrompts = data.map(item => {
          return {
            id: item.id,
            title: item.title || 'Untitled Prompt',
            prompt: item.prompt_text || '',
            promptText: item.prompt_text || '',
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            user_id: item.user_id || '',
            date: new Date(item.created_at || '').toLocaleString(),
            masterCommand: item.master_command || '',
            primaryToggle: item.primary_toggle,
            secondaryToggle: item.secondary_toggle,
            variables: jsonToVariables(item.variables as Json),
          } as SavedPrompt;
        });
        
        setSavedPrompts(formattedPrompts);
      }
    } catch (err) {
      console.error("Unexpected error fetching prompts:", err);
      setFetchPromptError(err as Error);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Load a saved prompt
  const loadSavedPrompt = async (promptId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();
        
      if (error) {
        console.error("Error loading prompt:", error);
        return;
      }
      
      if (data) {
        const prompt = {
          id: data.id,
          title: data.title || 'Untitled Prompt',
          prompt: data.prompt_text || '',
          promptText: data.prompt_text || '',
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          user_id: data.user_id || '',
          date: new Date(data.created_at || '').toLocaleString(),
          masterCommand: data.master_command || '',
          primaryToggle: data.primary_toggle,
          secondaryToggle: data.secondary_toggle,
          variables: jsonToVariables(data.variables as Json),
          tags: (data.tags as unknown as PromptTag[]) || []
        };
        
        setTitle(prompt.title);
        setPromptText(prompt.promptText);
        setMasterCommand(prompt.masterCommand);
        setPrimaryToggle(prompt.primaryToggle);
        setSecondaryToggle(prompt.secondaryToggle);
        setVariables(prompt.variables || []);
        setTags(prompt.tags || []);
        setCurrentStep(2);
        setIsViewingSavedPrompt(true);
      }
    } catch (err) {
      console.error("Error loading prompt:", err);
    }
  };

  // Create a new prompt
  const handleNewPrompt = () => {
    setTitle('');
    setPromptText('');
    setOriginalPrompt('');
    setMasterCommand('');
    setPrimaryToggle(null);
    setSecondaryToggle(null);
    setFinalPrompt('');
    setVariables(defaultVariables);
    setQuestions(mockQuestions);
    setCurrentStep(1);
    setIsViewingSavedPrompt(false);
    setCurrentDraftId(null);
  };

  // Duplicate a prompt
  const handleDuplicatePrompt = async (promptId: string) => {
    // Implementation here
    console.log("Duplicating prompt:", promptId);
  };

  // Rename a prompt
  const handleRenamePrompt = async (promptId: string, newTitle: string) => {
    // Implementation here
    console.log("Renaming prompt:", promptId, "to", newTitle);
  };

  // Delete a prompt
  const handleDeletePrompt = async (promptId: string) => {
    // Implementation here
    console.log("Deleting prompt:", promptId);
  };

  // Save a prompt
  const handleSavePrompt = async () => {
    // Implementation here
    console.log("Saving prompt");
  };

  return {
    savedPrompts,
    setSavedPrompts,
    currentStep,
    setCurrentStep,
    title,
    setTitle,
    originalPrompt,
    setOriginalPrompt,
    promptText,
    setPromptText,
    masterCommand,
    setMasterCommand,
    primaryToggle,
    setPrimaryToggle,
    secondaryToggle,
    setSecondaryToggle,
    finalPrompt,
    setFinalPrompt,
    editingPrompt,
    setEditingPrompt,
    showEditPromptSheet,
    setShowEditPromptSheet,
    showJson,
    setShowJson,
    questions,
    setQuestions,
    variables,
    setVariables,
    variableToDelete,
    setVariableToDelete,
    isEnhanced,
    setIsEnhanced,
    isSaving,
    setIsSaving,
    isAdapting,
    setIsAdapting,
    isPrivate,
    setIsPrivate,
    tags,
    setTags,
    jsonStructure,
    setJsonStructure,
    selectedTag,
    setSelectedTag,
    isDraft,
    setIsDraft,
    isNew,
    setIsNew,
    isDirty,
    setIsDirty,
    isTemplate,
    setIsTemplate,
    isForked,
    setIsForked,
    isDefault,
    setIsDefault,
    isDeleted,
    setIsDeleted,
    isPublic,
    setIsPublic,
    isFeatured,
    setIsFeatured,
    isRecommended,
    setIsRecommended,
    isPublished,
    setIsPublished,
    isArchived,
    setIsArchived,
    isShared,
    setIsShared,
    isFavorited,
    setIsFavorited,
    isCopied,
    setIsCopied,
    isRegenerating,
    setIsRegenerating,
    isAnalyzing,
    setIsAnalyzing,
    isOptimizing,
    setIsOptimizing,
    isSummarizing,
    setIsSummarizing,
    isTranslating,
    setIsTranslating,
    isCorrecting,
    setIsCorrecting,
    isExpanding,
    setIsExpanding,
    isShortening,
    setIsShortening,
    isCustomizing,
    setIsCustomizing,
    isImproving,
    setIsImproving,
    isPolishing,
    setIsPolishing,
    isSimplifying,
    setIsSimplifying,
    isElaborating,
    setIsElaborating,
    isRefining,
    setIsRefining,
    isRevising,
    setIsRevising,
    isModifying,
    setIsModifying,
    isTransforming,
    setIsTransforming,
    isViewingSavedPrompt,
    setIsViewingSavedPrompt,
    currentDraftId,
    setCurrentDraftId,
    fetchSavedPrompts,
    loadSavedPrompt,
    handleNewPrompt,
    handleDuplicatePrompt,
    handleRenamePrompt,
    handleDeletePrompt,
    handleSavePrompt,
    searchTerm,
    setSearchTerm,
    fetchPromptError,
    isLoadingPrompts,
    isLoadingDrafts: isDraftsLoading,
    drafts,
    saveDraft,
    loadSelectedDraft,
    handleDeleteDraft
  };
};
