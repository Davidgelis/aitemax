import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Twitter, Facebook, Instagram, Link2, Mail, Trash2, Eye, Copy, Share2, User, FileText, MoreVertical, CopyIcon, Pencil, Lock, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedPrompt, PromptTag } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getTextLines } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { XTemplateCard } from "@/components/x-templates/XTemplateCard";
import { TemplateEditor } from "@/components/x-templates/TemplateEditor";
import { XTemplatesList } from "@/components/x-templates/XTemplatesList";
import { useLanguage } from '@/context/LanguageContext';
import { xpanelTranslations } from '@/translations/xpanel';

const XPanel = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState("prompts");
  const [shareEmail, setShareEmail] = useState("");
  const [sharingPromptId, setSharingPromptId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { currentLanguage } = useLanguage();
  const t = xpanelTranslations[currentLanguage as keyof typeof xpanelTranslations] || xpanelTranslations.en;

  // Add state for prompt to delete
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  useEffect(() => {
    const getUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);
  useEffect(() => {
    if (user) {
      fetchPrompts();
      fetchUserProfile();
    }
  }, [user]);
  const fetchUserProfile = async () => {
    try {
      const {
        data: profileData,
        error
      } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single();
      if (error) {
        console.error("Error fetching user profile:", error);
      } else if (profileData) {
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('prompts').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      const formattedPrompts: SavedPrompt[] = data?.map(item => {
        const prompt: SavedPrompt = {
          id: item.id,
          title: item.title || 'Untitled Prompt',
          date: new Date(item.created_at || '').toLocaleString(),
          promptText: item.prompt_text || '',
          masterCommand: item.master_command || '',
          primaryToggle: item.primary_toggle,
          secondaryToggle: item.secondary_toggle,
          variables: item.variables ? JSON.parse(JSON.stringify(item.variables)) : [],
          tags: item.tags as unknown as PromptTag[] || []
        };
        return prompt;
      }) || [];
      setPrompts(formattedPrompts);
      setFilteredPrompts(formattedPrompts);

      // Extract unique categories and subcategories
      const allCategories = new Set<string>();
      const allSubcategories = new Set<string>();
      formattedPrompts.forEach(prompt => {
        if (prompt.tags && Array.isArray(prompt.tags)) {
          prompt.tags.forEach(tag => {
            if (tag.category) allCategories.add(tag.category);
            if (tag.subcategory) allSubcategories.add(tag.subcategory);
          });
        }
      });

      // Convert to arrays and sort alphabetically
      setCategories(Array.from(allCategories).sort((a, b) => a.localeCompare(b)));
      setSubcategories(Array.from(allSubcategories).sort((a, b) => a.localeCompare(b)));
    } catch (error: any) {
      console.error("Error fetching prompts:", error.message);
      toast({
        title: "Error fetching prompts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (prompts.length > 0) {
      let filtered = [...prompts];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(prompt => prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) || prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter(prompt => prompt.tags && prompt.tags.some(tag => tag.category === selectedCategory));
      }

      // Apply subcategory filter
      if (selectedSubcategory) {
        filtered = filtered.filter(prompt => prompt.tags && prompt.tags.some(tag => tag.subcategory === selectedSubcategory));
      }
      setFilteredPrompts(filtered);
    }
  }, [searchTerm, selectedCategory, selectedSubcategory, prompts]);
  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Copied to clipboard",
      description: "Prompt has been copied to your clipboard."
    });
  };
  const handleCopyLink = (promptId: string) => {
    const link = `${window.location.origin}/prompt/${promptId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Direct link has been copied to your clipboard."
    });
  };
  const handleDeletePrompt = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('prompts').delete().eq('id', id);
      if (error) {
        throw error;
      }
      setPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== id));
      setFilteredPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== id));
      toast({
        title: "Success",
        description: "Prompt deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting prompt:", error.message);
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setPromptToDelete(null);
    }
  };
  const handleShareViaEmail = (promptId: string) => {};
  const handleSharePrompt = async () => {
    if (!shareEmail || !sharingPromptId) return;
    setIsSharing(true);
    try {
      // In a real implementation, this would call an API to share the prompt
      // For now, we'll just show a success toast

      toast({
        title: "Prompt shared",
        description: `An invitation has been sent to ${shareEmail}`
      });
      setShareEmail("");
      setSharingPromptId(null);
    } catch (error: any) {
      console.error("Error sharing prompt:", error.message);
      toast({
        title: "Error sharing prompt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };
  const handlePreviewPrompt = (promptId: string) => {
    window.open(`/prompt/${promptId}`, '_blank');
  };
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };
  const getPlainText = (text: string) => {
    return text ? text.replace(/<[^>]*>/g, '') : '';
  };
  const handleRenamePrompt = async (id: string, newTitle: string) => {
    try {
      const {
        error
      } = await supabase.from('prompts').update({
        title: newTitle
      }).eq('id', id);
      if (error) {
        throw error;
      }

      // Update local state
      setPrompts(prompts.map(prompt => prompt.id === id ? {
        ...prompt,
        title: newTitle
      } : prompt));
      setFilteredPrompts(filteredPrompts.map(prompt => prompt.id === id ? {
        ...prompt,
        title: newTitle
      } : prompt));
      toast({
        title: "Success",
        description: "Prompt renamed successfully"
      });
    } catch (error: any) {
      console.error("Error renaming prompt:", error.message);
      toast({
        title: "Error renaming prompt",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const startEditing = (prompt: SavedPrompt) => {
    setEditingPromptId(prompt.id);
    setEditingTitle(prompt.title);
  };
  const saveEdit = () => {
    if (editingPromptId && editingTitle.trim()) {
      handleRenamePrompt(editingPromptId, editingTitle);
      setEditingPromptId(null);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingPromptId(null);
    }
  };

  // Function to get avatar image source based on avatar_url
  const getAvatarSrc = () => {
    if (!userProfile?.avatar_url) return '';

    // Map avatar_url to the actual image source
    const avatarMap: Record<string, string> = {
      "avatar1": "/lovable-uploads/9e9dab89-7884-4529-8d21-4635694140a0.png",
      "avatar2": "/lovable-uploads/599e8307-b1eb-411f-ac99-f096310d8073.png",
      "avatar3": "/lovable-uploads/6880916c-ef0f-41df-bba8-bae4076a3355.png",
      "avatar4": "/lovable-uploads/57623e13-ceba-4029-a7cc-a0317bcecff5.png",
      "avatar5": "/lovable-uploads/6bc3d174-c5ec-4312-adb8-2c7834ab72e0.png"
    };
    return avatarMap[userProfile.avatar_url] || '';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-0 relative">
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10">
                    <img alt="Aitema X Logo" className="w-full h-full" src="/lovable-uploads/68b3431d-50df-4904-96cc-983f6b3e6e89.png" />
                  </div>
                  <h1 className="text-3xl font-bold">
                    <span className="bg-aurora-gradient bg-aurora animate-aurora bg-clip-text text-transparent" style={{
                    backgroundSize: "400% 400%"
                  }}>
                      {t.title}
                    </span>
                  </h1>
                </div>
                <Button variant="aurora" onClick={() => navigate("/dashboard")}>
                  {t.createNewPrompt}
                </Button>
              </div>

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                  <TabsTrigger value="prompts">{t.tabs.savedPrompts}</TabsTrigger>
                  <TabsTrigger value="templates">{t.tabs.xTemplates}</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search and Filters - Only show in prompts tab */}
              {activeTab === "prompts" && (
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder={t.search.searchPrompts} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className={selectedCategory ? "bg-accent text-white" : ""}>
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t.search.filterByCategory}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={clearFilters}>
                          {t.search.showAll}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {categories.map(category => (
                          <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "bg-accent/20" : ""}>
                            {category}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className={selectedSubcategory ? "bg-accent text-white" : ""}>
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t.search.filterBySubcategory}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={clearFilters}>
                          {t.search.showAll}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {subcategories.map(subcategory => (
                          <DropdownMenuItem key={subcategory} onClick={() => setSelectedSubcategory(subcategory)} className={selectedSubcategory === subcategory ? "bg-accent/20" : ""}>
                            {subcategory}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {(selectedCategory || selectedSubcategory || searchTerm) && (
                      <Button variant="ghost" onClick={clearFilters}>
                        {t.search.clearFilters}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Templates Tab Content */}
            {activeTab === "templates" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium">{t.templates.yourSystemMessageTemplates}</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="template">
                        <Plus className="w-4 h-4 mr-2" />
                        {t.templates.createTemplate}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <TemplateEditor />
                    </DialogContent>
                  </Dialog>
                </div>
                <XTemplatesList />
              </div>
            )}

            {/* Prompts Grid - Only show in prompts tab */}
            {activeTab === "prompts" && (
              <>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                  </div>
                ) : filteredPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrompts.map(prompt => (
                      <Card 
                        key={prompt.id} 
                        className="group hover:scale-[1.01] transition-all overflow-hidden bg-white border-[1.5px] border-[#64bf95] shadow-md relative"
                      >
                        {/* Share Button in Top Right Corner */}
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/0">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-white border border-gray-200 shadow-md">
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm">{t.promptActions.share.sharePrompt} "{getPlainText(prompt.title)}"</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`share-email-${prompt.id}`}>
                                    {t.promptActions.share.emailAddress}
                                  </Label>
                                  <Input 
                                    id={`share-email-${prompt.id}`} 
                                    placeholder={t.promptActions.share.emailPlaceholder} 
                                    type="email" 
                                    value={sharingPromptId === prompt.id ? shareEmail : ""} 
                                    onChange={e => {
                                      setSharingPromptId(prompt.id);
                                      setShareEmail(e.target.value);
                                    }} 
                                  />
                                </div>
                                <Button 
                                  className="w-full bg-[#64bf95] hover:bg-[#64bf95]/90 text-white" 
                                  onClick={handleSharePrompt} 
                                  disabled={!shareEmail || isSharing || sharingPromptId !== prompt.id}
                                >
                                  {isSharing && sharingPromptId === prompt.id ? t.promptActions.share.sharing : t.promptActions.share.share}
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex flex-col h-full">
                            <div className="mb-3">
                              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{getPlainText(prompt.title)}</h3>
                              <p className="text-sm text-muted-foreground">{prompt.date}</p>
                            </div>
                            <div className="flex-1 mb-4">
                              <p className="text-sm line-clamp-3">{getPlainText(prompt.promptText)}</p>
                            </div>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {prompt.tags && prompt.tags.map((tag, index) => (
                                <div key={index} className="bg-[#64bf95]/10 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                                  <span className="font-medium">{tag.category}</span>
                                  {tag.subcategory && (
                                    <>
                                      <span>•</span>
                                      <span>{tag.subcategory}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Action Buttons - Updated with AlertDialog for delete */}
                            <div className="flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                {/* Empty div to keep the flex layout balanced */}
                              </div>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog open={promptToDelete === prompt.id} onOpenChange={open => !open && setPromptToDelete(null)}>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => setPromptToDelete(prompt.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white border p-6">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>{t.promptActions.deleteConfirmation.title}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {t.promptActions.deleteConfirmation.description}
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter className="mt-4">
                                            <AlertDialogCancel className="border-[#8E9196] text-[#8E9196]">{t.promptActions.deleteConfirmation.cancel}</AlertDialogCancel>
                                            <AlertDialogAction className="bg-[#ea384c] hover:bg-[#ea384c]/90" onClick={() => handleDeletePrompt(prompt.id)}>
                                              {t.promptActions.deleteConfirmation.delete}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t.promptActions.delete}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            {/* Main Actions */}
                            <div className="mt-4 flex justify-between">
                              <Button variant="outline" size="sm" onClick={() => handleCopyPrompt(prompt.promptText)}>
                                <Copy className="h-4 w-4 mr-2" />
                                {t.promptActions.copy}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePreviewPrompt(prompt.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t.promptActions.open}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium mb-2">{t.emptyState.noPromptsFound}</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedCategory || selectedSubcategory ? t.emptyState.tryAdjusting : t.emptyState.noPromptsYet}
                    </p>
                    {!searchTerm && !selectedCategory && !selectedSubcategory && (
                      <Button variant="aurora" onClick={() => navigate("/dashboard")}>
                        {t.emptyState.createFirstPrompt}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Sidebar with delete confirmation */}
        <Sidebar side="right">
          <SidebarTrigger className="fixed right-4 top-2 z-50 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
          <SidebarContent>
            <div className="p-4 flex items-center justify-between border-b mt-8">
              <div className="flex items-center gap-3">
                {userProfile?.avatar_url ? (
                  <Avatar className="w-10 h-10 border-2 border-[#33fea6]">
                    <AvatarImage src={getAvatarSrc()} alt="User avatar" />
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
                    <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 4.5C9.41421 4.5 9.75 4.16421 9.75 3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75C8.25 4.16421 8.58579 4.5 9 4.5Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 15C9.41421 15 9.75 14.6642 9.75 14.25C9.75 13.8358 9.41421 13.5 9 13.5C8.58579 13.5 8.25 13.8358 8.25 14.25C8.25 14.6642 8.58579 15 9 15Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="menu-item-glow">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {user ? (
                    <DropdownMenuItem onClick={async () => {
                      const { supabase } = await import('@/integrations/supabase/client');
                      await supabase.auth.signOut();
                    }} className="menu-item-glow">
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
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={t.search.searchPrompts} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="px-4 py-2 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t.sidebar.savedPrompts}</span>
              </div>
            </div>
            <div className="overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">{t.sidebar.loading}</span>
                </div>
              ) : filteredPrompts.length > 0 ? (
                filteredPrompts.map(item => (
                  <div key={item.id} className="p-4 border-b group/item cursor-pointer hover:bg-gray-50 transition-colors" 
                    style={{
                      minHeight: `${Math.max(72, getTextLines(getPlainText(item.title), 25) * 20 + 32)}px`
                    }} 
                    onClick={() => handlePreviewPrompt(item.id)}>
                    <div className="flex items-start w-full h-full">
                      <div className="flex items-start gap-2 w-[70%]">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          {editingPromptId === item.id ? (
                            <input type="text" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} className="text-sm font-medium border border-transparent focus:border-[#33fea6] focus:outline-none rounded px-1 w-full" autoFocus onClick={e => e.stopPropagation()} />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm font-medium break-words">
                                {getPlainText(item.title)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">{t.sidebar.noPromptsFound}</p>
                </div>
              )}
            </div>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
};

export default XPanel;
