
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Globe, Info, Youtube, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeMetadata, setYoutubeMetadata] = useState('');
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
        if (!youtubeTitle.trim() || !youtubeCaption.trim()) {
          toast({
            title: "Required fields missing",
            description: "Please provide both a video title and captions.",
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
        const fakeYoutubeUrl = `youtube://manual/${encodeURIComponent(youtubeTitle.trim())}`;
        
        // Format the pasted content for processing
        const formattedInstructions = `
PASTED YOUTUBE CONTENT:
Video Title: ${youtubeTitle.trim()}
User Instructions: ${instructions.trim()}

Video Captions:
${youtubeCaption.trim()}

Video Metadata:
${youtubeMetadata.trim()}

EXTRACTION TASK: ${instructions.trim()}
        `.trim();
        
        // Set success result
        setProcessingResult({
          success: true,
          message: `Successfully processed YouTube content: "${youtubeTitle}"`
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
      } else if (activeTab === 'youtube' && (youtubeTitle.trim() || youtubeCaption.trim() || youtubeMetadata.trim() || instructions.trim())) {
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
              <Input 
                id="website-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`w-full ${!url.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                required
              />
            </div>
          )}
          
          {/* YouTube Content Paste Fields */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="youtube-title" className="block text-sm font-medium text-[#545454] mb-2">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="youtube-title"
                  type="text"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  placeholder="Enter the YouTube video title"
                  className={`w-full ${!youtubeTitle.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="youtube-caption" className="block text-sm font-medium text-[#545454] mb-2">
                  Video Captions <span className="text-red-500">*</span>
                </label>
                <Textarea 
                  id="youtube-caption"
                  value={youtubeCaption}
                  onChange={(e) => setYoutubeCaption(e.target.value)}
                  placeholder="Paste the video captions or transcript here"
                  className={`w-full min-h-[100px] ${!youtubeCaption.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="youtube-metadata" className="block text-sm font-medium text-[#545454] mb-2">
                  Video Metadata <span className="text-gray-500">(optional)</span>
                </label>
                <Textarea 
                  id="youtube-metadata"
                  value={youtubeMetadata}
                  onChange={(e) => setYoutubeMetadata(e.target.value)}
                  placeholder="Paste additional video metadata (description, tags, etc.)"
                  className="w-full min-h-[80px] border-[#084b49]/30"
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
                  <Info size={14} className="flex-shrink-0" />
                  <p>
                    Add metadata like video description, publish date, channel name, 
                    or any other relevant information about the video.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Instructions textarea */}
          <div className="mb-4 mt-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What specific information do you want from this {activeTab === 'website' ? 'website' : 'YouTube content'}? <span className="text-red-500">*</span>
            </label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={activeTab === 'website' 
                ? "E.g., 'Extract best practices for landing pages' or 'Find information about pricing models'" 
                : "E.g., 'Extract colors mentioned by the artist' or 'List all tools used in the tutorial'"
              }
              className={`w-full min-h-[100px] resize-none ${!instructions.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
              required
            />
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
