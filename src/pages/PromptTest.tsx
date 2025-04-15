
import React, { useState } from "react";
import { ArrowLeft, Copy, Share2, Globe, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Variable } from "@/components/dashboard/types";

const mockPrompt = {
  id: "mock-1",
  title: "Test Marketing Campaign Prompt",
  date: new Date().toLocaleString(),
  promptText: "Create a compelling marketing campaign for {{product_name}} that targets {{target_audience}}. The campaign should focus on {{key_benefit}} and use a {{tone}} tone. Include specific examples of {{content_type}} that would resonate with the audience.",
  masterCommand: "Generate marketing campaign",
  variables: [
    { id: "1", name: "product_name", value: "EcoFriendly Water Bottle", isRelevant: true, category: "Product", code: "VAR_1" },
    { id: "2", name: "target_audience", value: "environmentally conscious millennials", isRelevant: true, category: "Audience", code: "VAR_2" },
    { id: "3", name: "key_benefit", value: "sustainability and style", isRelevant: true, category: "Benefits", code: "VAR_3" },
    { id: "4", name: "tone", value: "inspiring and authentic", isRelevant: true, category: "Style", code: "VAR_4" },
    { id: "5", name: "content_type", value: "social media posts and influencer collaborations", isRelevant: true, category: "Content", code: "VAR_5" }
  ],
  tags: [
    { category: "Marketing", subcategory: "Campaign" },
    { category: "Content", subcategory: "Social Media" }
  ]
};

const PromptTest = () => {
  const { toast } = useToast();
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [jsonView, setJsonView] = useState(() => {
    const jsonObj = {
      prompt: mockPrompt.promptText,
      variables: mockPrompt.variables.reduce((acc: any, v: Variable) => {
        if (v.name && v.value) {
          acc[v.name] = v.value;
        }
        return acc;
      }, {}),
      masterCommand: mockPrompt.masterCommand
    };
    return JSON.stringify(jsonObj, null, 2);
  });
  const [isLoadingJson, setIsLoadingJson] = useState(false);

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const handleShareViaEmail = async () => {
    if (!shareEmail) return;
    
    setIsSharing(true);
    try {
      toast({
        title: "Prompt shared",
        description: `An invitation has been sent to ${shareEmail}`,
      });
      setShareEmail("");
    } catch (error: any) {
      console.error("Error sharing prompt:", error);
      toast({
        title: "Error sharing prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRefreshJson = () => {
    setIsLoadingJson(true);
    try {
      const updatedJsonObj = {
        prompt: mockPrompt.promptText,
        variables: mockPrompt.variables.reduce((acc: any, v: Variable) => {
          if (v.name && v.value) {
            acc[v.name] = v.value;
          }
          return acc;
        }, {}),
        masterCommand: mockPrompt.masterCommand
      };
      setJsonView(JSON.stringify(updatedJsonObj, null, 2));
      
      toast({
        title: "JSON Updated",
        description: "JSON view has been refreshed with latest changes",
      });
    } catch (error: any) {
      console.error("Error refreshing JSON:", error);
      toast({
        title: "Error refreshing JSON",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingJson(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => history.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{mockPrompt.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mr-1" />
              <span>Test prompt</span>
            </div>
            
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
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {mockPrompt.tags.map((tag, index) => (
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
          
          <p className="text-sm text-muted-foreground">Created: {mockPrompt.date}</p>
        </div>
        
        <Card className="w-full mt-4">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">JSON Structure</h3>
              <Button 
                onClick={handleRefreshJson} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoadingJson}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingJson ? 'animate-spin' : ''}`} />
                {isLoadingJson ? 'Refreshing...' : 'Refresh JSON'}
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto max-w-full whitespace-pre-wrap break-words">
              <pre className="text-sm">{jsonView}</pre>
            </div>
            <div className="mt-4">
              <Button onClick={() => handleCopyContent(jsonView)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptTest;
