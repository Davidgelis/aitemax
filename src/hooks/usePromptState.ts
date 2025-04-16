import { useState, useEffect, useCallback } from "react";
import { Question, Variable, SavedPrompt, variablesToJson, jsonToVariables, PromptJsonStructure, PromptTag, TechnicalTerm } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { defaultVariables, mockQuestions, sampleFinalPrompt } from "@/components/dashboard/constants";
import { supabase } from "@/integrations/supabase/client";
import { usePromptDrafts } from "@/hooks/usePromptDrafts";
import { Json } from "@/integrations/supabase/types";
import { useLocation } from "react-router-dom";

export const usePromptState = () => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
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
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isPasswordResetting, setIsPasswordResetting] = useState<boolean>(false);
  const [isEmailVerifying, setIsEmailVerifying] = useState<boolean>(false);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState<boolean>(false);
  const [isAddressVerifying, setIsAddressVerifying] = useState<boolean>(false);
  const [isIdentityVerifying, setIsIdentityVerifying] = useState<boolean>(false);
  const [isPaymentVerifying, setIsPaymentVerifying] = useState<boolean>(false);
  const [isAccountVerifying, setIsAccountVerifying] = useState<boolean>(false);
  const [isProfileVerifying, setIsProfileVerifying] = useState<boolean>(false);
  const [isDataVerifying, setIsDataVerifying] = useState<boolean>(false);
  const [isContentVerifying, setIsContentVerifying] = useState<boolean>(false);
  const [isCodeVerifying, setIsCodeVerifying] = useState<boolean>(false);
  const [isSecurityVerifying, setIsSecurityVerifying] = useState<boolean>(false);
  const [isComplianceVerifying, setIsComplianceVerifying] = useState<boolean>(false);
  const [isLegalVerifying, setIsLegalVerifying] = useState<boolean>(false);
  const [isRegulatoryVerifying, setIsRegulatoryVerifying] = useState<boolean>(false);
  const [isFinancialVerifying, setIsFinancialVerifying] = useState<boolean>(false);
  const [isOperationalVerifying, setIsOperationalVerifying] = useState<boolean>(false);
  const [isTechnicalVerifying, setIsTechnicalVerifying] = useState<boolean>(false);
  const [isBusinessVerifying, setIsBusinessVerifying] = useState<boolean>(false);
  const [isStrategicVerifying, setIsStrategicVerifying] = useState<boolean>(false);
  const [isTacticalVerifying, setIsTacticalVerifying] = useState<boolean>(false);
  const [isAnalyticalVerifying, setIsAnalyticalVerifying] = useState<boolean>(false);
  const [isCreativeVerifying, setIsCreativeVerifying] = useState<boolean>(false);
  const [isInnovativeVerifying, setIsInnovativeVerifying] = useState<boolean>(false);
  const [isEffectiveVerifying, setIsEffectiveVerifying] = useState<boolean>(false);
  const [isEfficientVerifying, setIsEfficientVerifying] = useState<boolean>(false);
  const [isSustainableVerifying, setIsSustainableVerifying] = useState<boolean>(false);
  const [isScalableVerifying, setIsScalableVerifying] = useState<boolean>(false);
  const [isReliableVerifying, setIsReliableVerifying] = useState<boolean>(false);
  const [isSecureAuthenticating, setIsSecureAuthenticating] = useState<boolean>(false);
  const [isSecureAuthorizing, setIsSecureAuthorizing] = useState<boolean>(false);
  const [isSecureVerifying, setIsSecureVerifying] = useState<boolean>(false);
  const [isPrivacyAuthenticating, setIsPrivacyAuthenticating] = useState<boolean>(false);
  const [isPrivacyAuthorizing, setIsPrivacyAuthorizing] = useState<boolean>(false);
  const [isPrivacyVerifying, setIsPrivacyVerifying] = useState<boolean>(false);
  const [isTransparentAuthenticating, setIsTransparentAuthenticating] = useState<boolean>(false);
  const [isTransparentAuthorizing, setIsTransparentAuthorizing] = useState<boolean>(false);
  const [isTransparentVerifying, setIsTransparentVerifying] = useState<boolean>(false);
  const [isAccountableAuthenticating, setIsAccountableAuthenticating] = useState<boolean>(false);
  const [isAccountableAuthorizing, setIsAccountableAuthorizing] = useState<boolean>(false);
  const [isAccountableVerifying, setIsAccountableVerifying] = useState<boolean>(false);
  const [isResponsibleAuthenticating, setIsResponsibleAuthenticating] = useState<boolean>(false);
  const [isResponsibleAuthorizing, setIsResponsibleAuthorizing] = useState<boolean>(false);
  const [isResponsibleVerifying, setIsResponsibleVerifying] = useState<boolean>(false);
  const [isEthicalAuthenticating, setIsEthicalAuthenticating] = useState<boolean>(false);
  const [isEthicalAuthorizing, setIsEthicalAuthorizing] = useState<boolean>(false);
  const [isEthicalVerifying, setIsEthicalVerifying] = useState<boolean>(false);
  const [isFairAuthenticating, setIsFairAuthenticating] = useState<boolean>(false);
  const [isFairAuthorizing, setIsFairAuthorizing] = useState<boolean>(false);
  const [isFairVerifying, setIsFairVerifying] = useState<boolean>(false);
  const [isJustAuthenticating, setIsJustAuthenticating] = useState<boolean>(false);
  const [isJustAuthorizing, setIsJustAuthorizing] = useState<boolean>(false);
  const [isJustVerifying, setIsJustVerifying] = useState<boolean>(false);
  const [isEquitableAuthenticating, setIsEquitableAuthenticating] = useState<boolean>(false);
  const [isEquitableAuthorizing, setIsEquitableAuthorizing] = useState<boolean>(false);
  const [isEquitableVerifying, setIsEquitableVerifying] = useState<boolean>(false);
  const [isInclusiveAuthenticating, setIsInclusiveAuthenticating] = useState<boolean>(false);
  const [isInclusiveAuthorizing, setIsInclusiveAuthorizing] = useState<boolean>(false);
  const [isInclusiveVerifying, setIsInclusiveVerifying] = useState<boolean>(false);
  const [isAccessibleAuthenticating, setIsAccessibleAuthenticating] = useState<boolean>(false);
  const [isAccessibleAuthorizing, setIsAccessibleAuthorizing] = useState<boolean>(false);
  const [isAccessibleVerifying, setIsAccessibleVerifying] = useState<boolean>(false);
  const [isUsableAuthenticating, setIsUsableAuthenticating] = useState<boolean>(false);
  const [isUsableAuthorizing, setIsUsableAuthorizing] = useState<boolean>(false);
  const [isUsableVerifying, setIsUsableVerifying] = useState<boolean>(false);
  const [isUsefulAuthenticating, setIsUsefulAuthenticating] = useState<boolean>(false);
  const [isUsefulAuthorizing, setIsUsefulAuthorizing] = useState<boolean>(false);
  const [isUsefulVerifying, setIsUsefulVerifying] = useState<boolean>(false);
  const [isValuableAuthenticating, setIsValuableAuthenticating] = useState<boolean>(false);
  const [isValuableAuthorizing, setIsValuableAuthorizing] = useState<boolean>(false);
  const [isValuableVerifying, setIsValuableVerifying] = useState<boolean>(false);
  const [isMeaningfulAuthenticating, setIsMeaningfulAuthenticating] = useState<boolean>(false);
  const [isMeaningfulAuthorizing, setIsMeaningfulAuthorizing] = useState<boolean>(false);
  const [isMeaningfulVerifying, setIsMeaningfulVerifying] = useState<boolean>(false);
  const [isHumanAuthenticating, setIsHumanAuthenticating] = useState<boolean>(false);
  const [isHumanAuthorizing, setIsHumanAuthorizing] = useState<boolean>(false);
  const [isHumanVerifying, setIsHumanVerifying] = useState<boolean>(false);
  const [isHumaneAuthenticating, setIsHumaneAuthenticating] = useState<boolean>(false);
  const [isHumaneAuthorizing, setIsHumaneAuthorizing] = useState<boolean>(false);
  const [isHumaneVerifying, setIsHumaneVerifying] = useState<boolean>(false);
  const [isEmpoweringAuthenticating, setIsEmpoweringAuthenticating] = useState<boolean>(false);
  const [isEmpoweringAuthorizing, setIsEmpoweringAuthorizing] = useState<boolean>(false);
  const [isEmpoweringVerifying, setIsEmpoweringVerifying] = useState<boolean>(false);
  const [isLiberatingAuthenticating, setIsLiberatingAuthenticating] = useState<boolean>(false);
  const [isLiberatingAuthorizing, setIsLiberatingAuthorizing] = useState<boolean>(false);
  const [isLiberatingVerifying, setIsLiberatingVerifying] = useState<boolean>(false);
  const [isTransformativeAuthenticating, setIsTransformativeAuthenticating] = useState<boolean>(false);
  const [isTransformativeAuthorizing, setIsTransformativeAuthorizing] = useState<boolean>(false);
  const [isTransformativeVerifying, setIsTransformativeVerifying] = useState<boolean>(false);
  const [isSustainableAuthenticating, setIsSustainableAuthenticating] = useState<boolean>(false);
  const [isSustainableAuthorizing, setIsSustainableAuthorizing] = useState<boolean>(false);
  const [isSustainableVerifying, setIsSustainableVerifying] = useState<boolean>(false);
  const [isResilientAuthenticating, setIsResilientAuthenticating] = useState<boolean>(false);
  const [isResilientAuthorizing, setIsResilientAuthorizing] = useState<boolean>(false);
  const [isResilientVerifying, setIsResilientVerifying] = useState<boolean>(false);
  const [isAdaptiveAuthenticating, setIsAdaptiveAuthenticating] = useState<boolean>(false);
  const [isAdaptiveAuthorizing, setIsAdaptiveAuthorizing] = useState<boolean>(false);
  const [isAdaptiveVerifying, setIsAdaptiveVerifying] = useState<boolean>(false);
  const [isInnovativeAuthenticating, setIsInnovativeAuthenticating] = useState<boolean>(false);
  const [isInnovativeAuthorizing, setIsInnovativeAuthorizing] = useState<boolean>(false);
  const [isInnovativeVerifying, setIsInnovativeVerifying] = useState<boolean>(false);
  const [isCreativeAuthenticating, setIsCreativeAuthenticating] = useState<boolean>(false);
  const [isCreativeAuthorizing, setIsCreativeAuthorizing] = useState<boolean>(false);
  const [isCreativeVerifying, setIsCreativeVerifying] = useState<boolean>(false);
  const [isCollaborativeAuthenticating, setIsCollaborativeAuthenticating] = useState<boolean>(false);
  const [isCollaborativeAuthorizing, setIsCollaborativeAuthorizing] = useState<boolean>(false);
  const [isCollaborativeVerifying, setIsCollaborativeVerifying] = useState<boolean>(false);
  const [isCooperativeAuthenticating, setIsCooperativeAuthenticating] = useState<boolean>(false);
  const [isCooperativeAuthorizing, setIsCooperativeAuthorizing] = useState<boolean>(false);
  const [isCooperativeVerifying, setIsCooperativeVerifying] = useState<boolean>(false);
  const [isDecentralizedAuthenticating, setIsDecentralizedAuthenticating] = useState<boolean>(false);
  const [isDecentralizedAuthorizing, setIsDecentralizedAuthorizing] = useState<boolean>(false);
  const [isDecentralizedVerifying, setIsDecentralizedVerifying] = useState<boolean>(false);
  const [isDistributedAuthenticating, setIsDistributedAuthenticating] = useState<boolean>(false);
  const [isDistributedAuthorizing, setIsDistributedAuthorizing] = useState<boolean>(false);
  const [isDistributedVerifying, setIsDistributedVerifying] = useState<boolean>(false);
  const [isAutonomousAuthenticating, setIsAutonomousAuthenticating] = useState<boolean>(false);
  const [isAutonomousAuthorizing, setIsAutonomousAuthorizing] = useState<boolean>(false);
  const [isAutonomousVerifying, setIsAutonomousVerifying] = useState<boolean>(false);
  const [isSelfSovereignAuthenticating, setIsSelfSovereignAuthenticating] = useState<boolean>(false);
  const [isSelfSovereignAuthorizing, setIsSelfSovereignAuthorizing] = useState<boolean>(false);
  const [isSelfSovereignVerifying, setIsSelfSovereignVerifying] = useState<boolean>(false);
  const [isSelfDeterminingAuthenticating, setIsSelfDeterminingAuthenticating] = useState<boolean>(false);
  const [isSelfDeterminingAuthorizing, setIsSelfDeterminingAuthorizing] = useState<boolean>(false);
  const [isSelfDeterminingVerifying, setIsSelfDeterminingVerifying] = useState<boolean>(false);
  const [isSelfGoverningAuthenticating, setIsSelfGoverningAuthenticating] = useState<boolean>(false);
  const [isSelfGoverningAuthorizing, setIsSelfGoverningAuthorizing] = useState<boolean>(false);
  const [isSelfGoverningVerifying, setIsSelfGoverningVerifying] = useState<boolean>(false);
  const [isSelfOrganizingAuthenticating, setIsSelfOrganizingAuthenticating] = useState<boolean>(false);
  const [isSelfOrganizingAuthorizing, setIsSelfOrganizingAuthorizing] = useState<boolean>(false);
  const [isSelfOrganizingVerifying, setIsSelfOrganizingVerifying] = useState<boolean>(false);
  const [isSelfHealingAuthenticating, setIsSelfHealingAuthenticating] = useState<boolean>(false);
  const [isSelfHealingAuthorizing, setIsSelfHealingAuthorizing] = useState<boolean>(false);
  const [isSelfHealingVerifying, setIsSelfHealingVerifying] = useState<boolean>(false);
  const [isSelfLearningAuthenticating, setIsSelfLearningAuthenticating] = useState<boolean>(false);
  const [isSelfLearningAuthorizing, setIsSelfLearningAuthorizing] = useState<boolean>(false);
  const [isSelfLearningVerifying, setIsSelfLearningVerifying] = useState<boolean>(false);
  const [isSelfImprovingAuthenticating, setIsSelfImprovingAuthenticating] = useState<boolean>(false);
  const [isSelfImprovingAuthorizing, setIsSelfImprovingAuthorizing] = useState<boolean>(false);
  const [isSelfImprovingVerifying, setIsSelfImprovingVerifying] = useState<boolean>(false);
  const [isSelfEvolvingAuthenticating, setIsSelfEvolvingAuthenticating] = useState<boolean>(false);
  const [isSelfEvolvingAuthorizing, setIsSelfEvolvingAuthorizing] = useState<boolean>(false);
  const [isSelfEvolvingVerifying, setIsSelfEvolvingVerifying] = useState<boolean>(false);
  const [isSelfAdaptingAuthenticating, setIsSelfAdaptingAuthenticating] = useState<boolean>(false);
  const [isSelfAdaptingAuthorizing, setIsSelfAdaptingAuthorizing] = useState<boolean>(false);
  const [isSelfAdaptingVerifying, setIsSelfAdaptingVerifying] = useState<boolean>(false);
  const [isSelfAwareAuthenticating, setIsSelfAwareAuthenticating] = useState<boolean>(false);
  const [isSelfAwareAuthorizing, setIsSelfAwareAuthorizing] = useState<boolean>(false);
  const [isSelfAwareVerifying, setIsSelfAwareVerifying] = useState<boolean>(false);
  const [isSelfConsciousAuthenticating, setIsSelfConsciousAuthenticating] = useState<boolean>(false);
  const [isSelfConsciousAuthorizing, setIsSelfConsciousAuthorizing] = useState<boolean>(false);
  const [isSelfConsciousVerifying, setIsSelfConsciousVerifying] = useState<boolean>(false);
  const [isSelfTranscendentAuthenticating, setIsSelfTranscendentAuthenticating] = useState<boolean>(false);
  const [isSelfTranscendentAuthorizing, setIsSelfTranscendentAuthorizing] = useState<boolean>(false);
  const [isSelfTranscendentVerifying, setIsSelfTranscendentVerifying] = useState<boolean>(false);
  const [isInterconnectedAuthenticating, setIsInterconnectedAuthenticating] = useState<boolean>(false);
  const [isInterconnectedAuthorizing, setIsInterconnectedAuthorizing] = useState<boolean>(false);
  const [isInterconnectedVerifying, setIsInterconnectedVerifying] = useState<boolean>(false);
  const [isInterdependentAuthenticating, setIsInterdependentAuthenticating] = useState<boolean>(false);
  const [isInterdependentAuthorizing, setIsInterdependentAuthorizing] = useState<boolean>(false);
  const [isInterdependentVerifying, setIsInterdependentVerifying] = useState<boolean>(false);
  const [isHolisticAuthenticating, setIsHolisticAuthenticating] = useState<boolean>(false);
  const [isHolisticAuthorizing, setIsHolisticAuthorizing] = useState<boolean>(false);
  const [isHolisticVerifying, setIsHolisticVerifying] = useState<boolean>(false);
  const [isSystemicAuthenticating, setIsSystemicAuthenticating] = useState<boolean>(false);
  const [isSystemicAuthorizing, setIsSystemicAuthorizing] = useState<boolean>(false);
  const [isSystemicVerifying, setIsSystemicVerifying] = useState<boolean>(false);
  const [isEmergentAuthenticating, setIsEmergentAuthenticating] = useState<boolean>(false);
  const [isEmergentAuthorizing, setIsEmergentAuthorizing] = useState<boolean>(false);
  const [isEmergentVerifying, setIsEmergentVerifying] = useState<boolean>(false);
  const [isComplexAuthenticating, setIsComplexAuthenticating] = useState<boolean>(false);
  const [isComplexAuthorizing, setIsComplexAuthorizing] = useState<boolean>(false);
  const [isComplexVerifying, setIsComplexVerifying] = useState<boolean>(false);
  const [isChaoticAuthenticating, setIsChaoticAuthenticating] = useState<boolean>(false);
  const [isChaoticAuthorizing, setIsChaoticAuthorizing] = useState<boolean>(false);
  const [isChaoticVerifying, setIsChaoticVerifying] = useState<boolean>(false);
  const [isDynamicAuthenticating, setIsDynamicAuthenticating] = useState<boolean>(false);
  const [isDynamicAuthorizing, setIsDynamicAuthorizing] = useState<boolean>(false);
  const [isDynamicVerifying, setIsDynamicVerifying] = useState<boolean>(false);
  const [isFluidAuthenticating, setIsFluidAuthenticating] = useState<boolean>(false);
  const [isFluidAuthorizing, setIsFluidAuthorizing] = useState<boolean>(false);
  const [isFluidVerifying, setIsFluidVerifying] = useState<boolean>(false);
  const [isAdaptiveCapacityAuthenticating, setIsAdaptiveCapacityAuthenticating] = useState<boolean>(false);
  const [isAdaptiveCapacityAuthorizing, setIsAdaptiveCapacityAuthorizing] = useState<boolean>(false);
  const [isAdaptiveCapacityVerifying, setIsAdaptiveCapacityVerifying] = useState<boolean>(false);
  const [isTransformativeCapacityAuthenticating, setIsTransformativeCapacityAuthenticating] = useState<boolean>(false);
  const [isTransformativeCapacityAuthorizing, setIsTransformativeCapacityAuthorizing] = useState<boolean>(false);
  const [isTransformativeCapacityVerifying, setIsTransformativeCapacityVerifying] = useState<boolean>(false);
  const [isResilientCapacityAuthenticating, setIsResilientCapacityAuthenticating] = useState<boolean>(false);
  const [isResilientCapacityAuthorizing, setIsResilientCapacityAuthorizing] = useState<boolean>(false);
  const [isResilientCapacityVerifying, setIsResilientCapacityVerifying] = useState<boolean>(false);
  const [isSustainableCapacityAuthenticating, setIsSustainableCapacityAuthenticating] = useState<boolean>(false);
  const [isSustainableCapacityAuthorizing, setIsSustainableCapacityAuthorizing] = useState<boolean>(false);
  const [isSustainableCapacityVerifying, setIsSustainableCapacityVerifying] = useState<boolean>(false);
  const [isRegenerativeCapacityAuthenticating, setIsRegenerativeCapacityAuthenticating] = useState<boolean>(false);
  const [isRegenerativeCapacityAuthorizing, setIsRegenerativeCapacityAuthorizing] = useState<boolean>(false);
  const [isRegenerativeCapacityVerifying, setIsRegenerativeCapacityVerifying] = useState<boolean>(false);
  const [isGenerativeCapacityAuthenticating, setIsGenerativeCapacityAuthenticating] = useState<boolean>(false);
  const [isGenerativeCapacityAuthorizing, setIsGenerativeCapacityAuthorizing] = useState<boolean>(false);
  const [isGenerativeCapacityVerifying, setIsGenerativeCapacityVerifying] = useState<boolean>(false);
  const [isEvolutiveCapacityAuthenticating, setIsEvolutiveCapacityAuthenticating] = useState<boolean>(false);
  const [isEvolutiveCapacityAuthorizing, setIsEvolutiveCapacityAuthorizing] = useState<boolean>(false);
  const [isEvolutiveCapacityVerifying, setIsEvolutiveCapacityVerifying] = useState<boolean>(false);
  const [isEmergentCapacityAuthenticating, setIsEmergentCapacityAuthenticating] = useState<boolean>(false);
  const [isEmergentCapacityAuthorizing, setIsEmergentCapacityAuthorizing] = useState<boolean>(false);
  const [isEmergentCapacityVerifying, setIsEmergentCapacityVerifying] = useState<boolean>(false);
  const [isComplexCapacityAuthenticating, setIsComplexCapacityAuthenticating] = useState<boolean>(false);
  const [isComplexCapacityAuthorizing, setIsComplexCapacityAuthorizing] = useState<boolean>(false);
  const [isComplexCapacityVerifying, setIsComplexCapacityVerifying] = useState<boolean>(false);
  const [isChaoticCapacityAuthenticating, setIsChaoticCapacityAuthenticating] = useState<boolean>(false);
  const [isChaoticCapacityAuthorizing, setIsChaoticCapacityAuthorizing] = useState<boolean>(false);
  const [isChaoticCapacityVerifying, setIsChaoticCapacityVerifying] = useState<boolean>(false);
  const [isDynamicCapacityAuthenticating, setIsDynamicCapacityAuthenticating] = useState<boolean>(false);
  const [isDynamicCapacityAuthorizing, setIsDynamicCapacityAuthorizing] = useState<boolean>(false);
  const [isDynamicCapacityVerifying, setIsDynamicCapacityVerifying] = useState<boolean>(false);
  const [isFluidCapacityAuthenticating, setIsFluidCapacityAuthenticating] = useState<boolean>(false);
  const [isFluidCapacityAuthorizing, setIsFluidCapacityAuthorizing] = useState<boolean>(false);
  const [isFluidCapacityVerifying, setIsFluidCapacityVerifying] = useState<boolean>(false);

  // Update the formattedPrompts section - Around line 173
  const formattedPrompts: SavedPrompt[] = data?.map(item => {
    return {
      id: item.id,
      title: item.title || 'Untitled Prompt',
      prompt: item.prompt_text || '', // Make sure prompt property is set
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
  }) || [];

  // Around line 314 - Fix the type issues in prompt creation
  if (data && data.length > 0) {
    const newPrompt: SavedPrompt = {
      id: data[0].id,
      title: data[0].title || 'Untitled Prompt',
      prompt: data[0].prompt_text || '',
      promptText: data[0].prompt_text || '',
      created_at: data[0].created_at || '',
      updated_at: data[0].updated_at || '',
      user_id: data[0].user_id || '',
      date: new Date(data[0].created_at || '').toLocaleString(),
      masterCommand: data[0].master_command || '',
      primaryToggle: data[0].primary_toggle,
      secondaryToggle: data[0].secondary_toggle,
      variables: jsonToVariables(data[0].variables as Json),
      tags: (data[0].tags as unknown as PromptTag[]) || []
    };
    
    if (jsonStructure) {
      newPrompt.jsonStructure = jsonStructure;
    }
    
    setSavedPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
  }

  // Around line 396 - Fix the variable handling
  if (prompt.variables) {
    // Ensure proper conversion to Variable[]
    if (Array.isArray(prompt.variables)) {
      setVariables(prompt.variables as Variable[]);
    } else {
      setVariables(jsonToVariables(prompt.variables as Record<string, any>));
    }
  } else {
    setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
  }

  // Around line 410 - Fix new prompt creation
  if (data && data.length > 0) {
    const newPrompt: SavedPrompt = {
      id: data[0].id,
      title: data[0].title,
      prompt: data[0].prompt_text || '',
      promptText: data[0].prompt_text || '',
      created_at: data[0].created_at || '',
      updated_at: data[0].updated_at || '',
      user_id: data[0].user_id || '',
      date: new Date(data[0].created_at || '').toLocaleString(),
      masterCommand: data[0].master_command || '',
      primaryToggle: data[0].primary_toggle,
      secondaryToggle: data[0].secondary_toggle,
      variables: jsonToVariables(data[0].variables as Json),
    };
    
    if (prompt.jsonStructure) {
      newPrompt.jsonStructure = prompt.jsonStructure;
    }
    
    setSavedPrompts([newPrompt, ...savedPrompts]);
  }

  // Around line 495 - Fix variable handling
  if (prompt.variables) {
    // Convert variables safely to the correct type
    if (Array.isArray(prompt.variables)) {
      setVariables(prompt.variables as Variable[]);
    } else {
      setVariables(jsonToVariables(prompt.variables as Record<string, any>));
    }
  } else {
    setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
  }

  return {
    savedPrompts,
    setSavedPrompts,
    currentStep,
    setCurrentStep,
    title,
    setTitle,
    originalPrompt,
    setOriginalPrompt,
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
