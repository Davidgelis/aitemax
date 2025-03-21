
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedPrompt } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PromptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [user, setUser] = useState<any>(null);
  const [jsonView, setJsonView] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPrompt(id);
    }
  }, [id, user]);

  const fetchPrompt = async (promptId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        toast({
          title: "Prompt not found",
          description: "The prompt you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/x-panel");
        return;
      }
      
      const formattedPrompt: SavedPrompt = {
        id: data.id,
        title: data.title || 'Untitled Prompt',
        date: new Date(data.created_at || '').toLocaleString(),
        promptText: data.prompt_text || '',
        masterCommand: data.master_command || '',
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        variables: data.variables ? JSON.parse(JSON.stringify(data.variables)) : [],
        tags: (data.tags as unknown as Array<{category: string, subcategory: string}>) || []
      };
      
      setPrompt(formattedPrompt);
      setIsOwner(user && data.user_id === user.id);
      
      // Generate JSON view for the prompt if it has variables
      if (formattedPrompt.variables && formattedPrompt.variables.length > 0) {
        const jsonObj = {
          prompt: formattedPrompt.promptText,
          variables: formattedPrompt.variables.reduce((acc: any, v: any) => {
            if (v.name && v.value) {
              acc[v.name] = v.value;
            }
            return acc;
          }, {}),
          masterCommand: formattedPrompt.masterCommand
        };
        setJsonView(JSON.stringify(jsonObj, null, 2));
      }
      
    } catch (error: any) {
      console.error("Error fetching prompt:", error.message);
      toast({
        title: "Error fetching prompt",
        description: error.message,
        variant: "destructive",
      });
      navigate("/x-panel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const handleShareViaEmail = async () => {
    if (!shareEmail || !prompt) return;
    
    setIsSharing(true);
    
    try {
      // This would be integrated with an email service
      // For now, we'll just simulate the process
      
      toast({
        title: "Prompt shared",
        description: `An invitation has been sent to ${shareEmail}`,
      });
      
      setShareEmail("");
    } catch (error: any) {
      console.error("Error sharing prompt:", error.message);
      toast({
        title: "Error sharing prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getPlainText = (text: string) => {
    return text ? text.replace(/<[^>]*>/g, '') : '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Prompt not found</h2>
          <Button variant="default" onClick={() => navigate("/x-panel")}>
            Go to X Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/x-panel")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{getPlainText(prompt.title)}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mr-1" />
                <span>You own this prompt</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <Globe className="h-4 w-4 mr-1" />
                <span>Shared with you</span>
              </div>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Prompt</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="email" className="mb-2 block">
                    Enter email address to share this prompt
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      placeholder="friend@example.com"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                    <Button 
                      onClick={handleShareViaEmail} 
                      disabled={!shareEmail || isSharing}
                    >
                      {isSharing ? "Sending..." : "Share"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recipients will need an account to view this prompt
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {prompt.tags && prompt.tags.map((tag, index) => (
              <div key={index} className="bg-accent/10 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
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
          
          <p className="text-sm text-muted-foreground">Created: {prompt.date}</p>
        </div>
        
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="prompt">Prompt Text</TabsTrigger>
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  {prompt.masterCommand && (
                    <div className="bg-gray-50 p-4 rounded-md mb-4 border">
                      <h3 className="text-sm font-medium mb-2">Master Command</h3>
                      <p className="text-sm">{prompt.masterCommand}</p>
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap mb-4">
                    {getPlainText(prompt.promptText)}
                  </div>
                  
                  {prompt.variables && prompt.variables.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <h3 className="text-sm font-medium mb-2">Variables</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prompt.variables.map((variable: any, index) => (
                          <div key={index} className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">{variable.name}</label>
                            <Input value={variable.value} readOnly className="text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button onClick={() => handleCopyContent(getPlainText(prompt.promptText))}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Prompt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="json" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                  {jsonView}
                </pre>
                <div className="mt-4">
                  <Button onClick={() => handleCopyContent(jsonView)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PromptView;
