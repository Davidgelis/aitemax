import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Globe, Info, Youtube, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WebScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
  onDeleteScan?: () => void;
  savedUrl?: string;
  savedInstructions?: string;
  hasContext?: boolean;
}

export const WebScanDialog = ({
  open,
  onOpenChange,
  onWebsiteScan,
  onDeleteScan,
  savedUrl = '',
  savedInstructions = '',
  hasContext = false
}: WebScanDialogProps) => {
  const [activeTab, setActiveTab] = useState<'website' | 'youtube'>('website');
  const [url, setUrl] = useState(savedUrl);
  const [youtubeCaption, setYoutubeCaption] = useState('');
  const [instructions, setInstructions] = useState(savedInstructions);
  const [isLoading, setIsLoading] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();
  
  // Update state when props change
  useEffect(() => {
    if (open) {
      // Reset processing result when dialog opens
      setProcessingResult(null);
      setUrl(savedUrl);
      setInstructions(savedInstructions);
      // Check if savedUrl is a YouTube-related context and switch to the YouTube tab
      if (savedUrl.includes('youtube.com') || savedUrl.includes('youtu.be')) {
        setActiveTab('youtube');
      } else {
        setActiveTab('website');
      }
    }
  }, [open, savedUrl, savedInstructions]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset the processing result
    setProcessingResult(null);
    setIsLoading(true);
    
    try {
      // Handle based on active tab
      if (activeTab === 'youtube') {
        // Validate YouTube inputs
        if (!youtubeCaption.trim()) {
          toast({
            title: "Required field missing",
            description: "Please provide video captions.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!instructions.trim()) {
          toast({
            title: "Context required",
            description: "Please provide specific instructions for what information to extract from this YouTube content.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Create a placeholder URL for YouTube content to maintain structure compatibility
        const fakeYoutubeUrl = `youtube://manual/caption`;
        
        // Format the pasted content for processing
        const formattedInstructions = `
PASTED YOUTUBE CONTENT:
User Instructions: ${instructions.trim()}

Video Captions:
${youtubeCaption.trim()}

EXTRACTION TASK: ${instructions.trim()}
        `.trim();
        
        // Set success result
        setProcessingResult({
          success: true,
          message: `Successfully processed YouTube content`
        });
        
        // Pass to parent component
        onWebsiteScan(fakeYoutubeUrl, formattedInstructions);
        
        // Close the dialog on success after brief delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        // Website handling
        if (!url.trim()) {
          toast({
            title: "Website URL required",
            description: "Please provide a website URL.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        if (!instructions.trim()) {
          toast({
            title: "Context required",
            description: "Please provide specific instructions for what information to extract from this website.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Set success result
        setProcessingResult({
          success: true,
          message: "Website context added successfully."
        });
        
        // Process the regular website URL
        onWebsiteScan(url.trim(), instructions.trim());
        
        // Close the dialog on success after brief delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setProcessingResult({
        success: false,
        message: "An unexpected error occurred while processing your request."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    // If closing and fields are filled, prompt user
    if (!open) {
      let hasUnsavedContent = false;
      
      if (activeTab === 'website' && url.trim() && instructions.trim()) {
        hasUnsavedContent = true;
      } else if (activeTab === 'youtube' && (youtubeCaption.trim() || instructions.trim())) {
        hasUnsavedContent = true;
      }
      
      if (hasUnsavedContent && !savedUrl && !savedInstructions) {
        toast({
          title: "Discard changes?",
          description: "You have unsaved changes that will be lost.",
        });
      }
    }
    onOpenChange(open);
  };
  
  const clearTextField = (field: 'url' | 'youtubeCaption' | 'instructions') => {
    switch (field) {
      case 'url':
        setUrl('');
        break;
      case 'youtubeCaption':
        setYoutubeCaption('');
        break;
      case 'instructions':
        setInstructions('');
        break;
    }
  };
  
  const currentUrlIsYoutube = savedUrl && (savedUrl.includes('youtube.com') || savedUrl.includes('youtu.be') || savedUrl.includes('youtube://manual/'));
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Web Smart Scan</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">
            Use website content to enhance your original prompt
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          {/* Tab Selection */}
          <div className="flex mb-4 border-b">
            <button
              type="button"
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'website' 
                ? 'text-[#084b49] border-b-2 border-[#084b49]' 
                : 'text-[#545454]'}`}
              onClick={() => setActiveTab('website')}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </button>
            <button
              type="button"
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'youtube' 
                ? 'text-[#084b49] border-b-2 border-[#084b49]' 
                : 'text-[#545454]'}`}
              onClick={() => setActiveTab('youtube')}
            >
              <Youtube className="w-4 h-4 inline mr-1" />
              YouTube
            </button>
          </div>
          
          {/* Website URL Input */}
          {activeTab === 'website' && (
            <div className="mb-4">
              <label htmlFor="website-url" className="block text-sm font-medium text-[#545454] mb-2">
                Website URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  id="website-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full pr-10 ${!url.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                  required
                />
                {url.trim() && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearTextField('url')}
                    title="Clear URL"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* YouTube Content Paste Fields */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="youtube-caption" className="block text-sm font-medium text-[#545454] mb-2">
                  Video Captions <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Textarea 
                    id="youtube-caption"
                    value={youtubeCaption}
                    onChange={(e) => setYoutubeCaption(e.target.value)}
                    placeholder="Paste the video captions or transcript here"
                    className={`w-full min-h-[180px] pr-10 ${!youtubeCaption.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                    required
                  />
                  {youtubeCaption.trim() && (
                    <button
                      type="button"
                      className="absolute right-2 top-4 text-gray-400 hover:text-gray-600"
                      onClick={() => clearTextField('youtubeCaption')}
                      title="Clear captions"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Instructions textarea */}
          <div className="mb-4 mt-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What specific information do you want from this {activeTab === 'website' ? 'website' : 'content'}? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Textarea 
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={activeTab === 'website' 
                  ? "E.g., 'Extract best practices for landing pages' or 'Find information about pricing models'" 
                  : "E.g., 'Extract colors mentioned by the artist' or 'List all tools used in the tutorial'"
                }
                className={`w-full min-h-[100px] resize-none pr-10 ${!instructions.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                required
              />
              {instructions.trim() && (
                <button
                  type="button"
                  className="absolute right-2 top-4 text-gray-400 hover:text-gray-600"
                  onClick={() => clearTextField('instructions')}
                  title="Clear instructions"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                {activeTab === 'website' ? (
                  <>
                    Be specific about what information you want extracted to enhance your prompt. For example:
                    "Find all best practices for landing page design", "Extract key features of successful SaaS websites", 
                    or "Identify pricing structure patterns used by competitors".
                  </>
                ) : (
                  <>
                    Be very specific about what information you want extracted from the pasted content. For example:
                    "Extract all paint colors mentioned in the transcript", "List all cooking ingredients used", 
                    or "Find all programming libraries mentioned in the tutorial".
                  </>
                )}
              </p>
            </div>
          </div>
          
          {/* Processing result message */}
          {processingResult && (
            <div className={`mb-4 p-3 rounded-md flex items-start gap-2 ${
              processingResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{processingResult.message}</p>
            </div>
          )}
          
          <div className="flex justify-end mt-4">            
            <div className="flex ml-auto">
              <Button
                type="submit"
                className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2 shadow-[0_0_0_0_#33fea6] transition-all duration-300 hover:shadow-[0_0_10px_0_#33fea6]"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (hasContext ? "Update Context" : "Use as Context")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
