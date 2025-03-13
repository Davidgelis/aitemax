
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Globe, Info, Youtube, Loader2 } from 'lucide-react';
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
  const { toast } = useToast();
  
  // Update state when props change
  useEffect(() => {
    if (open) {
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
          const response = await fetch(`https://zsvfxzbcfdxqhblcgptd.supabase.co/functions/v1/youtube-transcript?videoId=${videoId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch transcript: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Use the transcript as the context (the onWebsiteScan function will handle this)
          console.log("Successfully fetched YouTube transcript");
        } catch (error) {
          console.error("YouTube transcript fetch error:", error);
          toast({
            title: "Failed to fetch YouTube transcript",
            description: error instanceof Error ? error.message : "An unexpected error occurred",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Process the data and close the dialog
      onWebsiteScan(selectedUrl.trim(), instructions.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
                  Provide a YouTube video URL to extract and analyze captions/subtitles from the video.
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
                : "E.g., 'Summarize the main points' or 'Extract technical details mentioned in the video'"
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
                    Be specific about what information you want extracted from the video captions. For example:
                    "Extract key points about machine learning", "Find all technical terms mentioned", 
                    or "Summarize the presenter's main arguments".
                  </>
                )}
              </p>
            </div>
          </div>
          
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
