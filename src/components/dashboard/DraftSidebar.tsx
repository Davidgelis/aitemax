
import { Clock, MoreVertical, Search, FileText, User, AlertCircle } from "lucide-react";
import { Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { getTextLines } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { getAvatarByValue } from "@/config/avatarConfig";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash, BarChart } from "lucide-react";

interface DraftSidebarProps {
  user: any;
  drafts?: any[];
  isLoadingDrafts?: boolean;
  loadDraft?: (draft: any) => void;
  handleDeleteDraft?: (id: string) => void;
  currentDraftId?: string | null;
  userProfile?: {
    avatar_url?: string;
    username?: string;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleNewPrompt: () => void;
  fetchSavedPrompts?: () => Promise<void>;
}

export const DraftSidebar = ({
  user,
  drafts = [],
  isLoadingDrafts = false,
  loadDraft,
  handleDeleteDraft,
  userProfile,
  searchTerm,
  setSearchTerm,
  handleNewPrompt,
  fetchSavedPrompts
}: DraftSidebarProps) => {
  const navigate = useNavigate();
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { refreshSession } = useAuth();

  const isAdmin = user?.id === "8b40d73f-fffb-411f-9044-480773968d58";
  
  // Helper function to ensure we're displaying plain text
  const getPlainText = (text: string) => {
    return text ? text.replace(/<[^>]*>/g, '') : '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Enhanced retry function with better error handling
  const retryFetchPrompts = useCallback(async () => {
    setLoadingError(null);
    if (fetchSavedPrompts) {
      try {
        console.log("Manually retrying prompt fetch");
        // Try refreshing the session before fetching
        await refreshSession();
        
        // Short delay to allow token to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await fetchSavedPrompts();
        setRetryCount(0); // Reset retry count on success
      } catch (error: any) {
        console.error("Error retrying prompt fetch:", error);
        setLoadingError(error?.message || "Failed to load prompts. Please try again.");
        setRetryCount(prev => prev + 1);
      }
    }
  }, [fetchSavedPrompts, refreshSession]);

  // Attempt to refresh session if we're having network issues - improved logic
  useEffect(() => {
    if (loadingError) {
      const isAuthError = loadingError.toLowerCase().includes('jwt') || 
                          loadingError.toLowerCase().includes('token') ||
                          loadingError.toLowerCase().includes('auth');
      
      if (isAuthError || retryCount > 1) {
        console.log("Attempting to refresh session due to fetch errors");
        // Adding a delay before refreshing to avoid race conditions
        const timer = setTimeout(() => {
          refreshSession().then(() => {
            // Wait a bit before trying to fetch prompts again
            setTimeout(() => {
              retryFetchPrompts();
            }, 1000);
          });
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loadingError, retryCount, refreshSession, retryFetchPrompts]);

  const filteredContent = drafts.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sidebar side="right">
      <SidebarTrigger className="fixed right-4 top-2 z-50 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
      
      <SidebarContent>
        <div className="p-4 flex items-center justify-between border-b mt-8">
          <div className="flex items-center gap-3">
            {userProfile?.avatar_url ? (
              <Avatar className="w-10 h-10 border-2 border-[#33fea6]">
                <AvatarImage src={getAvatarByValue(userProfile.avatar_url).src} alt="User avatar" />
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <span className="font-medium">
              {userProfile?.username || (user ? (user.email || 'User').split('@')[0] : 'Guest')}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded-md transition-all hover:shadow-[0_0_10px_rgba(51,254,166,0.7)] focus:shadow-[0_0_10px_rgba(51,254,166,0.7)]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 4.5C9.41421 4.5 9.75 4.16421 9.75 3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75C8.25 4.16421 8.58579 4.5 9 4.5Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15C9.41421 15 9.75 14.6642 9.75 14.25C9.75 13.8358 9.41421 13.5 9 13.5C8.58579 13.5 8.25 13.8358 8.25 14.25C8.25 14.6642 8.58579 15 9 15Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="menu-item-glow">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/analytics")} className="menu-item-glow">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>
              )}
              
              {user ? (
                <DropdownMenuItem 
                  onClick={async () => {
                    const { supabase } = await import('@/integrations/supabase/client');
                    await supabase.auth.signOut();
                  }}
                  className="menu-item-glow"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/auth")} className="menu-item-glow">
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Sign in</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-center my-3">
          <button
            onClick={handleNewPrompt}
            className="aurora-button w-[70%] inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">New Prompt</span>
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto">
          {loadingError ? (
            <div className="p-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-md p-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="text-sm text-red-600">{loadingError}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={retryFetchPrompts}
                    className="mt-2 text-xs"
                  >
                    Retry Loading
                  </Button>
                  {retryCount > 1 && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      Refresh Page
                    </Button>
                  )}
                </div>
                {retryCount > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Session may have expired. Try refreshing the page.
                  </p>
                )}
              </div>
            </div>
          ) : (isLoadingDrafts) ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-sm text-muted-foreground">Loading content...</span>
            </div>
          ) : filteredContent.length > 0 ? (
            <>
              <div className="px-4 py-2 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Drafts</span>
                </div>
              </div>
              
              {filteredContent.map((draft) => (
                <div
                  key={draft.id || 'local-draft'}
                  className="p-4 border-b flex items-center hover:bg-gray-50 transition-colors cursor-pointer min-h-[72px] group/draft"
                  onClick={() => loadDraft && loadDraft(draft)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0 w-[70%]">
                      <div className="flex items-center">
                        <span className="text-sm font-medium line-clamp-2">
                          {getPlainText(draft.title || 'Untitled Draft')} <span className="text-xs font-normal text-muted-foreground">(Draft)</span>
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(draft.updated_at) || 'Recently edited'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto flex-shrink-0 h-full flex items-center">
                    <AlertDialog open={draftToDelete === draft.id} onOpenChange={(open) => !open && setDraftToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDraftToDelete(draft.id);
                          }}
                          className="p-2 hover:text-destructive transition-colors opacity-0 group-hover/draft:opacity-100"
                          title="Delete draft"
                          aria-label="Delete draft"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border p-6">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this draft? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                          <AlertDialogCancel className="border-[#8E9196] text-[#8E9196]">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-[#ea384c] hover:bg-[#ea384c]/90" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (handleDeleteDraft && draft.id) {
                                handleDeleteDraft(draft.id);
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {user ? (
                searchTerm ? "No matching drafts found" : "No saved drafts yet"
              ) : (
                <div className="space-y-3">
                  <p>Please sign in to save and view your drafts</p>
                  <Button onClick={() => navigate("/auth")} className="aurora-button">
                    Sign in
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
