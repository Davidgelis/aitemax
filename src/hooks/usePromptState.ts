import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SavedPrompt, Variable, Question } from '@/components/dashboard/types';
import { PromptService } from '@/services/prompt';
import { useToast } from './use-toast';
import { UploadedImage } from '@/components/dashboard/types';

interface PromptState {
  promptText: string;
  masterCommand: string;
  variables: Variable[];
  savedPrompts: SavedPrompt[];
  searchTerm: string;
  selectedPrimary: string | null;
  secondaryToggle: string | null;
  currentStep: number;
  uploadedImages: UploadedImage[];
  drafts: SavedPrompt[];
  currentDraftId: string | null;
  isViewingSavedPrompt: boolean;
  isLoadingPrompts: boolean;
  isLoadingDrafts: boolean;
}

const initialPromptState: PromptState = {
  promptText: '',
  masterCommand: '',
  variables: [],
  savedPrompts: [],
  searchTerm: '',
  selectedPrimary: null,
  secondaryToggle: null,
  currentStep: 1,
  uploadedImages: [],
  drafts: [],
  currentDraftId: null,
  isViewingSavedPrompt: false,
  isLoadingPrompts: true,
  isLoadingDrafts: true,
};

export const usePromptState = (user: any) => {
  const [state, setState] = useState<PromptState>(initialPromptState);
  const { toast } = useToast();

  // Load saved prompts from the database
  const fetchSavedPrompts = useCallback(async () => {
    setState(prevState => ({ ...prevState, isLoadingPrompts: true }));
    try {
      const prompts = await PromptService.getPrompts(user?.id);
      setState(prevState => ({ ...prevState, savedPrompts: prompts }));
    } catch (error: any) {
      console.error('Error fetching saved prompts:', error);
      toast({
        title: 'Error fetching prompts',
        description: error.message || 'Failed to load saved prompts.',
        variant: 'destructive',
      });
    } finally {
      setState(prevState => ({ ...prevState, isLoadingPrompts: false }));
    }
  }, [user?.id, toast]);

  // Load draft prompts from the database
  const fetchDrafts = useCallback(async () => {
    setState(prevState => ({ ...prevState, isLoadingDrafts: true }));
    try {
      const drafts = await PromptService.getDrafts(user?.id);
      setState(prevState => ({ ...prevState, drafts: drafts }));
    } catch (error: any) {
      console.error('Error fetching draft prompts:', error);
      toast({
        title: 'Error fetching drafts',
        description: error.message || 'Failed to load draft prompts.',
        variant: 'destructive',
      });
    } finally {
      setState(prevState => ({ ...prevState, isLoadingDrafts: false }));
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
      fetchDrafts();
    }
  }, [user, fetchSavedPrompts, fetchDrafts]);

  const updateState = (newState: Partial<PromptState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  const setPromptText = (promptText: string) => updateState({ promptText });
  const setMasterCommand = (masterCommand: string) => updateState({ masterCommand });
  const setVariables = (variables: Variable[]) => updateState({ variables });
  const setSearchTerm = (searchTerm: string) => updateState({ searchTerm });
  const setSelectedPrimary = (selectedPrimary: string | null) => updateState({ selectedPrimary });
  const setSecondaryToggle = (secondaryToggle: string | null) => updateState({ secondaryToggle });
  const setCurrentStep = (currentStep: number) => updateState({ currentStep });
  const setUploadedImages = (uploadedImages: UploadedImage[]) => updateState({ uploadedImages });

  const handleNewPrompt = () => {
    updateState({
      promptText: '',
      masterCommand: '',
      variables: [],
      selectedPrimary: null,
      secondaryToggle: null,
      currentStep: 1,
      uploadedImages: [],
      isViewingSavedPrompt: false,
    });
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await PromptService.deletePrompt(promptId);
      setState(prevState => ({
        ...prevState,
        savedPrompts: prevState.savedPrompts.filter(prompt => prompt.id !== promptId),
      }));
      toast({
        title: 'Prompt deleted',
        description: 'The prompt has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting prompt:', error);
      toast({
        title: 'Error deleting prompt',
        description: error.message || 'Failed to delete the prompt.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicatePrompt = async (promptToDuplicate: SavedPrompt) => {
    try {
      const newPrompt = await PromptService.duplicatePrompt(promptToDuplicate);
       setState(prevState => ({
        ...prevState,
        savedPrompts: [...prevState.savedPrompts, newPrompt],
      }));
      toast({
        title: 'Prompt duplicated',
        description: 'The prompt has been successfully duplicated.',
      });
    } catch (error: any) {
      console.error('Error duplicating prompt:', error);
      toast({
        title: 'Error duplicating prompt',
        description: error.message || 'Failed to duplicate the prompt.',
        variant: 'destructive',
      });
    }
  };

  const handleRenamePrompt = async (promptId: string, newTitle: string) => {
    try {
      await PromptService.renamePrompt(promptId, newTitle);
      setState(prevState => ({
        ...prevState,
        savedPrompts: prevState.savedPrompts.map(prompt =>
          prompt.id === promptId ? { ...prompt, title: newTitle } : prompt
        ),
      }));
      toast({
        title: 'Prompt renamed',
        description: 'The prompt has been successfully renamed.',
      });
    } catch (error: any) {
      console.error('Error renaming prompt:', error);
      toast({
        title: 'Error renaming prompt',
        description: error.message || 'Failed to rename the prompt.',
        variant: 'destructive',
      });
    }
  };

  const loadSavedPrompt = async (promptId: string) => {
    try {
      const prompt = await PromptService.getPromptById(promptId);
      if (prompt) {
        updateState({
          promptText: prompt.promptText,
          masterCommand: prompt.masterCommand || '',
          variables: prompt.variables,
          selectedPrimary: prompt.primaryToggle,
          secondaryToggle: prompt.secondaryToggle,
          currentStep: 3,
          uploadedImages: [], // Clear images when loading a saved prompt
          isViewingSavedPrompt: true,
        });
      } else {
        toast({
          title: 'Prompt not found',
          description: 'The requested prompt could not be found.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading saved prompt:', error);
      toast({
        title: 'Error loading prompt',
        description: error.message || 'Failed to load the saved prompt.',
        variant: 'destructive',
      });
    }
  };

  const loadSelectedDraft = async (draftId: string) => {
    try {
      const draft = await PromptService.getDraftById(draftId);
      if (draft) {
        updateState({
          promptText: draft.promptText,
          masterCommand: draft.masterCommand || '',
          variables: draft.variables,
          selectedPrimary: draft.primaryToggle,
          secondaryToggle: draft.secondaryToggle,
          currentStep: 3,
          uploadedImages: [],
          currentDraftId: draftId,
          isViewingSavedPrompt: false,
        });
      } else {
        toast({
          title: 'Draft not found',
          description: 'The requested draft could not be found.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error loading draft',
        description: error.message || 'Failed to load the draft.',
        variant: 'destructive',
      });
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        promptText: state.promptText,
        masterCommand: state.masterCommand,
        variables: state.variables,
        primaryToggle: state.selectedPrimary,
        secondaryToggle: state.secondaryToggle,
        userId: user?.id,
      };
      
      // Make sure we pass isPrivate here
      await PromptService.saveDraftPrompt({
        ...draftData,
        isPrivate: false
      });
      
      fetchDrafts();
      toast({
        title: 'Draft saved',
        description: 'The prompt has been saved as a draft.',
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error saving draft',
        description: error.message || 'Failed to save the draft.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await PromptService.deleteDraft(draftId);
      setState(prevState => ({
        ...prevState,
        drafts: prevState.drafts.filter(draft => draft.id !== draftId),
      }));
      toast({
        title: 'Draft deleted',
        description: 'The draft has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error deleting draft',
        description: error.message || 'Failed to delete the draft.',
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    setPromptText,
    setMasterCommand,
    setVariables,
    setSearchTerm,
    setSelectedPrimary,
    setSecondaryToggle,
    setCurrentStep,
    setUploadedImages,
    handleNewPrompt,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleRenamePrompt,
    loadSavedPrompt,
    saveDraft,
    drafts: state.drafts,
    loadSelectedDraft,
    handleDeleteDraft,
    fetchSavedPrompts,
    fetchDrafts,
  };
};
