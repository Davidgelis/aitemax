import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, RefreshCw, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PromptJsonStructure, Variable } from "@/components/dashboard/types";
import { VariableEditor } from "@/components/dashboard/step-three/VariableEditor";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptStructureView } from "@/components/dashboard/step-three/PromptStructureView";
import { prepareDataForEnhancement } from "@/lib/prompt-enhancement";

interface FinalPromptDisplayProps {
  finalPrompt: string;
  setFinalPrompt: (prompt: string) => void;
  variables: Variable[];
  setVariables: (variables: Variable[]) => void;
  handleVariableValueChange: (id: string, value: string) => void;
  handleCopyPrompt: () => void;
  handleRegenerate: () => void;
  showJson: boolean;
  jsonStructure?: PromptJsonStructure;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: (adaptationType: string) => void;
  getProcessedPrompt: () => string;
}

export const FinalPromptDisplay: React.FC<FinalPromptDisplayProps> = ({
  finalPrompt,
  setFinalPrompt,
  variables,
  setVariables,
  handleVariableValueChange,
  handleCopyPrompt,
  handleRegenerate,
  showJson,
  jsonStructure,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt,
  getProcessedPrompt,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("prompt");
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopy = () => {
    handleCopyPrompt();
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard.",
    });
  };

  const handleEnhancePrompt = () => {
    try {
      const response = prepareDataForEnhancement({});
      setIsEnhancing(true);
      
      // Simulate enhancement process
      setTimeout(() => {
        setIsEnhancing(false);
        toast({
          title: "Prompt Enhanced",
          description: "Your prompt has been enhanced for better results.",
        });
      }, 1500);
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    }
  };

  const processedPrompt = getProcessedPrompt();

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h2 className="text-2xl font-bold">Your Final Prompt</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnhancePrompt}
            className="flex items-center gap-1"
            disabled={isEnhancing}
          >
            <Wand2 className="h-4 w-4" />
            {isEnhancing ? "Enhancing..." : "Enhance"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditPrompt}
            className="flex items-center gap-1"
          >
            Edit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>
        <TabsContent value="prompt" className="space-y-4">
          {showJson && jsonStructure ? (
            <PromptStructureView jsonStructure={jsonStructure} />
          ) : (
            <Textarea
              value={processedPrompt}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          )}
        </TabsContent>
        <TabsContent value="variables" className="space-y-4">
          <div className="grid gap-4">
            {variables.length > 0 ? (
              variables.map((variable) => (
                <VariableEditor
                  key={variable.id}
                  variable={variable}
                  onValueChange={(value) =>
                    handleVariableValueChange(variable.id, value)
                  }
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No variables found in your prompt.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={showEditPromptSheet} onOpenChange={setShowEditPromptSheet}>
        <SheetContent className="sm:max-w-2xl w-[90vw]">
          <SheetHeader>
            <SheetTitle>Edit Prompt</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <Textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditPromptSheet(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEditedPrompt}>Save Changes</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
