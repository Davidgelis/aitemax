import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  Twitter, 
  Facebook, 
  Instagram, 
  Link2, 
  Mail, 
  Trash2, 
  Eye, 
  Copy, 
  Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedPrompt, PromptTag } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const XPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
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
          tags: (item.tags as unknown as PromptTag[]) || []
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
      
      setCategories(Array.from(allCategories));
      setSubcategories(Array.from(allSubcategories));
      
    } catch (error: any) {
      console.error("Error fetching prompts:", error.message);
      toast({
        title: "Error fetching prompts",
        description: error.message,
        variant: "destructive",
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
        filtered = filtered.filter(prompt => 
          prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter(prompt => 
          prompt.tags && prompt.tags.some(tag => tag.category === selectedCategory)
        );
      }
      
      // Apply subcategory filter
      if (selectedSubcategory) {
        filtered = filtered.filter(prompt => 
          prompt.tags && prompt.tags.some(tag => tag.subcategory === selectedSubcategory)
        );
      }
      
      setFilteredPrompts(filtered);
    }
  }, [searchTerm, selectedCategory, selectedSubcategory, prompts]);

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Copied to clipboard",
      description: "Prompt has been copied to your clipboard.",
    });
  };

  const handleCopyLink = (promptId: string) => {
    const link = `${window.location.origin}/prompt/${promptId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Direct link has been copied to your clipboard.",
    });
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== id));
      setFilteredPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== id));
      
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting prompt:", error.message);
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShareViaEmail = (promptId: string) => {
    // In a real implementation, this would open a modal to enter email addresses
    toast({
      title: "Share via Email",
      description: "Email sharing feature is coming soon!",
    });
  };

  const handleSocialShare = (platform: string, promptId: string) => {
    // In a real implementation, this would share to the selected platform
    toast({
      title: `Share on ${platform}`,
      description: `${platform} sharing integration is coming soon!`,
    });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">X Panel</h1>
          </div>
          
          <Button variant="aurora" onClick={() => navigate("/dashboard")}>
            Create New Prompt
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search prompts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                    <p>Filter by category</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={clearFilters}>
                  Show all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-accent/20" : ""}
                  >
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
                    <p>Filter by subcategory</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={clearFilters}>
                  Show all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subcategories.map((subcategory) => (
                  <DropdownMenuItem 
                    key={subcategory}
                    onClick={() => setSelectedSubcategory(subcategory)}
                    className={selectedSubcategory === subcategory ? "bg-accent/20" : ""}
                  >
                    {subcategory}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(selectedCategory || selectedSubcategory || searchTerm) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
        
        {/* Prompts Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card 
                key={prompt.id} 
                className="group hover:scale-[1.01] transition-all overflow-hidden bg-white border-[1.5px] border-[#64bf95] shadow-md"
              >
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
                    
                    {/* Action Buttons - Initially hidden, visible on hover */}
                    <div className="flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleSocialShare('Twitter', prompt.id)}>
                                <Twitter className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share on X (Twitter)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleSocialShare('Facebook', prompt.id)}>
                                <Facebook className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share on Facebook</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleSocialShare('Instagram', prompt.id)}>
                                <Instagram className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share on Instagram</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleCopyLink(prompt.id)}>
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleShareViaEmail(prompt.id)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share via email</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="prompt-action-button" onClick={() => handleDeletePrompt(prompt.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete prompt</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    {/* Main Actions */}
                    <div className="mt-4 flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleCopyPrompt(prompt.promptText)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePreviewPrompt(prompt.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No prompts found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedCategory || selectedSubcategory 
                ? "Try adjusting your search or filters"
                : "You haven't created any prompts yet"}
            </p>
            {!searchTerm && !selectedCategory && !selectedSubcategory && (
              <Button variant="aurora" onClick={() => navigate("/dashboard")}>
                Create Your First Prompt
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default XPanel;
