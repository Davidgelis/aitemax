
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Globe, Info, Youtube, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
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
      // Check if savedUrl is a YouTube URL and switch to the YouTube tab
      if (savedUrl.includes('youtube.com') || savedUrl.includes('youtu.be')) {
        setYoutubeUrl(savedUrl);
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
    
    // Determine the URL to use based on active tab
    const selectedUrl = activeTab === 'website' ? url : youtubeUrl;
    
    // Validate inputs
    if (!selectedUrl.trim()) {
      toast({
        title: activeTab === 'website' ? "Website URL required" : "YouTube URL required",
        description: `Please provide a ${activeTab === 'website' ? 'website' : 'YouTube'} URL.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!instructions.trim()) {
      toast({
        title: "Context required",
        description: `Please provide specific instructions for what information to extract from this ${activeTab === 'website' ? 'website' : 'YouTube video'}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // If it's a YouTube URL, fetch the transcript first
      if (activeTab === 'youtube') {
        const videoId = extractYouTubeVideoId(youtubeUrl);
        
        if (!videoId) {
          toast({
            title: "Invalid YouTube URL",
            description: "Could not extract video ID from the URL. Please ensure it's a valid YouTube video URL.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        try {
          console.log(`Fetching transcript for YouTube video ID: ${videoId}`);
          
          // Pass user instructions as a query parameter
          const encodedInstructions = encodeURIComponent(instructions);
          const response = await fetch(`https://zsvfxzbcfdxqhblcgptd.supabase.co/functions/v1/youtube-transcript?videoId=${videoId}&instructions=${encodedInstructions}`);
          
          if (!response.ok) {
            console.error(`YouTube transcript API error: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to connect to transcript service: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.success && data.error) {
            console.error("YouTube transcript fetch error:", data.error);
            
            let errorMessage = data.error;
            if (data.errorType === 'caption_unavailable') {
              errorMessage = "This video doesn't have captions available, or they cannot be accessed due to YouTube API limitations.";
            }
            
            // Set error result
            setProcessingResult({
              success: false,
              message: errorMessage
            });
            
            setIsLoading(false);
            return;
          }
          
          console.log("Successfully fetched YouTube data:", data.title);
          
          // If we have a limitation info, show it but consider the process successful
          if (data.limitationInfo) {
            console.log("YouTube API limitation note:", data.limitationInfo);
            
            setProcessingResult({
              success: true,
              message: `Successfully extracted metadata from "${data.title}". Note: ${data.limitationInfo}`
            });
          } else {
            // Set success result
            setProcessingResult({
              success: true,
              message: `Successfully extracted information from "${data.title}".`
            });
          }
          
          // Process the data
          onWebsiteScan(youtubeUrl.trim(), instructions.trim());
          
          // Close the dialog on success after brief delay
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
          
        } catch (error) {
          console.error("Error in YouTube transcript processing:", error);
          
          // Set error result with more helpful message
          let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
          
          if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Failed to connect")) {
            errorMessage = "Network error: Could not connect to the transcript service. Please check your internet connection and try again.";
          }
          
          if (errorMessage.includes("OAuth")) {
            errorMessage = "Due to YouTube API limitations, we cannot access the full transcript but extracted available metadata instead.";
            
            // Even with OAuth limitations, we can use the metadata
            setProcessingResult({
              success: true,
              message: errorMessage
            });
            
            // Process with the available data
            onWebsiteScan(youtubeUrl.trim(), instructions.trim());
            
            // Close the dialog on partial success after brief delay
            setTimeout(() => {
              onOpenChange(false);
            }, 1500);
            
            setIsLoading(false);
            return;
          }
          
          setProcessingResult({
            success: false,
            message: errorMessage
          });
          
          setIsLoading(false);
          return;
        }
      } else {
        // For regular website, proceed without fetching transcript
        onWebsiteScan(url.trim(), instructions.trim());
        
        // Set success result
        setProcessingResult({
          success: true,
          message: "Website context added successfully."
        });
        
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
    if (!open && ((activeTab === 'website' ? url.trim() : youtubeUrl.trim()) || instructions.trim())) {
      if (!savedUrl && !savedInstructions) {
        toast({
          title: "Discard changes?",
          description: "You have unsaved changes that will be lost.",
        });
      }
    }
    onOpenChange(open);
  };
  
  // Helper function to extract YouTube video ID
  const extractYouTubeVideoId = (url: string): string | null => {
    // Handle various YouTube URL formats
    const regExpPatterns = [
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,  // Standard YouTube URLs
      /^.*(youtube.com\/shorts\/)([^#&?]*).*/  // YouTube Shorts URLs
    ];
    
    for (const pattern of regExpPatterns) {
      const match = url.match(pattern);
      if (match && match[2] && match[2].length >= 11) {
        return match[2];
      }
    }
    
    return null;
  };
  
  const currentUrlIsYoutube = savedUrl && (savedUrl.includes('youtube.com') || savedUrl.includes('youtu.be'));
  
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
          
          {/* YouTube URL Input */}
          {activeTab === 'youtube' && (
            <div className="mb-4">
              <label htmlFor="youtube-url" className="block text-sm font-medium text-[#545454] mb-2">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <Input 
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className={`w-full ${!youtubeUrl.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
                required
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
                <Info size={14} className="flex-shrink-0" />
                <p>
                  Provide a YouTube video URL to extract and analyze information from the video.
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What specific information do you want from this {activeTab === 'website' ? 'website' : 'YouTube video'}? <span className="text-red-500">*</span>
            </label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={activeTab === 'website' 
                ? "E.g., 'Extract best practices for landing pages' or 'Find information about pricing models'" 
                : "E.g., 'Extract colors mentioned by the artist' or 'List all tools used in the tutorial'"
              }
              className={`w-full min-h-[120px] resize-none ${!instructions.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
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
                    Be very specific about what information you want extracted from the video. For example:
                    "Extract all paint colors mentioned by the artist", "List all cooking ingredients used", 
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  hasContext ? "Update Context" : "Use as Context"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
