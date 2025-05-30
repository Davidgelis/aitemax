import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PromptInput from "@/components/PromptInput";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { SmartContext } from "@/components/dashboard/SmartContext";
import { TemplateSelector } from "./TemplateSelector";
import { AIModel, UploadedImage } from "./types";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';
import { GPT41_ID } from "@/services/model/ModelFetchService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepOneContentProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
  onImagesChange?: (images: UploadedImage[]) => void;
  onWebsiteScan?: (url: string, instructions: string) => void;
  onSmartContext?: (context: string, usageInstructions: string) => void;
  setPreventStepChange?: (prevent: boolean) => void;
}

export const StepOneContent = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading,
  selectedModel,
  setSelectedModel,
  selectedCognitive,
  handleCognitiveToggle,
  onImagesChange = () => {},
  onWebsiteScan = () => {},
  onSmartContext = () => {},
  setPreventStepChange = () => {}
}: StepOneContentProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{
    url: string;
    instructions: string;
  } | null>(null);
  const [smartContext, setSmartContext] = useState<{
    context: string;
    usageInstructions: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const maxCharacterLimit = 3000;
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    currentLanguage
  } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  // Extract user intent from prompt for better context display
  const extractUserIntent = (text: string): string => {
    if (!text || text.length < 10) return '';

    // For short prompts, return the whole prompt
    if (text.length < 60) return text;

    // Otherwise extract first sentence or first 8-10 words
    const firstSentence = text.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
    if (firstSentence && firstSentence.length < 80) {
      return firstSentence.trim();
    }

    // Fall back to first 8-10 words
    return text.split(' ').slice(0, 10).join(' ');
  };
  const userIntent = extractUserIntent(promptText);
  const handleAnalyzeWithAuth = () => {
    if (!user) {
      // Store current prompt in sessionStorage before redirecting
      if (promptText.trim()) {
        sessionStorage.setItem("redirectedPrompt", promptText);
        // Add a flag to indicate we want to stay on step 1
        sessionStorage.setItem("stayOnStepOne", "true");
      }

      // Redirect to auth page with return URL to dashboard
      navigate("/auth?returnUrl=/dashboard");
      return;
    }

    // If user is authenticated, proceed with analysis
    handleAnalyzeWithContext();
  };
  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log("StepOneContent: Images updated:", images.map(img => ({
      id: img.id,
      hasBase64: !!img.base64,
      base64Length: img.base64 ? img.base64.length : 0,
      hasContext: !!img.context,
      contextText: img.context ? img.context.substring(0, 30) + '...' : 'none'
    })));

    // Only pass images to parent if there are actually images to pass
    if (images && images.length > 0) {
      onImagesChange(images);
    }
  };
  const handleWebsiteScan = (url: string, instructions: string = "") => {
    // Only set and pass context if valid data was provided
    if (url && instructions) {
      const contextData = {
        url,
        instructions
      };
      setWebsiteContext(contextData);
      console.log("StepOneContent: Website context set:", contextData);
      onWebsiteScan(url, instructions);
    }
  };
  const handleSmartContext = (context: string, usageInstructions: string = "") => {
    // Only set and pass context if valid data was provided
    if (context) {
      const contextData = {
        context,
        usageInstructions
      };
      setSmartContext(contextData);
      console.log("StepOneContent: Smart context set:", {
        context: context.substring(0, 100) + (context.length > 100 ? "..." : ""),
        usageInstructions: usageInstructions.substring(0, 100) + (usageInstructions.length > 100 ? "..." : "")
      });
      onSmartContext(context, usageInstructions);
    }
  };
  const handleAnalyzeWithContext = () => {
    console.log("StepOneContent: Analyzing with GPT-4.1:", {
      promptText,
      userIntent,
      uploadedImages: uploadedImages.length,
      uploadedImagesData: uploadedImages.map(img => ({
        id: img.id,
        hasBase64: !!img.base64,
        base64Length: img.base64 ? img.base64.length : 0,
        hasContext: !!img.context,
        contextText: img.context ? img.context.substring(0, 30) + '...' : 'none'
      })),
      websiteContext,
      smartContext: smartContext ? "Provided" : "None",
      selectedPrimary,
      selectedSecondary,
      model: GPT41_ID
    });
    onAnalyze();
  };
  const handleOpenUploadDialog = () => {
    // Set the flag to prevent step change during image context operations
    setPreventStepChange(true);
    console.log("StepOneContent: Opening image upload dialog, preventing step change");
    setDialogOpen(true);
  };
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    // If dialog is closing, make sure we reset the prevent step change flag
    // but with a slight delay to ensure any context dialog actions
    if (!open) {
      console.log("StepOneContent: Image dialog closing, will reset prevent step flag soon");
      // Use a small timeout to ensure the flag is reset after any context dialog actions
      setTimeout(() => {
        console.log("StepOneContent: Resetting prevent step change flag");
        setPreventStepChange(false);
      }, 300);
    }
  };

  // Add a clean up function for images on component unmount
  useEffect(() => {
    return () => {
      console.log("StepOneContent: Cleaning up images on unmount");
      setUploadedImages([]);
    };
  }, []);
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 justify-center items-center p-4 pt-12">
        {/* Contains everything in a single bordered card */}
        <div className="w-full border rounded-xl bg-card flex flex-col p-4 mt-4 mb-6 relative">
          {/* Smart button controls above templates */}
          <div className="w-full mb-8">
            <div className="flex items-center gap-4 flex-wrap mb-5">
              <div className="flex flex-row items-center gap-4">
                <WebScanner onWebsiteScan={handleWebsiteScan} variant="modelReplacement" />
                <SmartContext onSmartContext={handleSmartContext} variant="modelReplacement" />
                <button 
                  onClick={handleOpenUploadDialog} 
                  className="w-[220px] h-10 bg-white border border-[#e5e7eb] text-[#545454] hover:bg-[#f8f9fa] flex justify-between items-center shadow-sm text-sm rounded-md px-4"
                  title="Upload and analyze images with GPT-4o"
                >
                  <span className="truncate ml-1">{t.steps.imageSmartScan}</span>
                  <ImageUp className="mr-1 h-4 w-4 text-[#084b49]" />
                </button>
              </div>
            </div>
          
            {/* Template selector appears directly under smart buttons */}
            <div className="mb-8 w-full">
              <TemplateSelector />
            </div>
          </div>

          {uploadedImages.length > 0 && (
            <div className="mb-3 p-2 w-full bg-[#fafafa] border border-[#e5e7eb] rounded-md">
              <div className="flex flex-col gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={img.id || index} className="flex flex-col"></div>
                ))}
              </div>
              <ImageUploader images={uploadedImages} onImagesChange={handleImagesChange} open={dialogOpen} onOpenChange={handleDialogOpenChange} />
            </div>
          )}

          {smartContext && smartContext.context && (
            <div className="mb-3 p-2 w-full bg-[#fafafa] border border-[#e5e7eb] rounded-md">
              <h3 className="text-sm font-medium text-[#545454] mb-1">{t.steps.smartContextAdded}</h3>
              <p className="text-xs text-[#545454] italic truncate">
                {smartContext.context.substring(0, 100)}
                {smartContext.context.length > 100 ? "..." : ""}
              </p>
            </div>
          )}

          {/* PromptInput */}
          <div className="relative w-full">
            <PromptInput 
              value={promptText} 
              onChange={setPromptText} 
              onSubmit={handleAnalyzeWithAuth} 
              className="w-full"
              images={uploadedImages} 
              onImagesChange={handleImagesChange} 
              isLoading={isLoading} 
              onOpenUploadDialog={handleOpenUploadDialog} 
              dialogOpen={dialogOpen} 
              setDialogOpen={setDialogOpen} 
              maxLength={maxCharacterLimit} 
              placeholder={t.steps.promptTextPlaceholder} 
              customStyles={{
                textareaBackground: "#fafafa",
                textareaText: "#545454",
                paddingBottom: "10px" // Reduce bottom padding of textarea
              }}
              textareaHeight="280px" // Reduce height of textarea
            />
          </div>
        </div> {/* end of bordered card */}
      </div>
    </div>
  );
};
