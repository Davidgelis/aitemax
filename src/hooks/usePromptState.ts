
  const loadSelectedDraftState = (draft: any) => {
    const draftData = loadSelectedDraft(draft);
    
    // Load draft regardless of step
    if (draftData.promptText) setPromptText(draftData.promptText);
    if (draftData.masterCommand) setMasterCommand(draftData.masterCommand);
    if (draftData.variables) setVariables(draftData.variables);
    if (draftData.selectedPrimary) setSelectedPrimary(draftData.selectedPrimary);
    if (draftData.secondaryToggle) setSelectedSecondary(draftData.secondaryToggle);
    if (draftData.currentStep) setCurrentStep(draftData.currentStep);
    
    setFinalPrompt(draftData.promptText || "");
    
    toast({
      title: "Draft Loaded",
      description: "Your draft has been restored.",
    });
  };
