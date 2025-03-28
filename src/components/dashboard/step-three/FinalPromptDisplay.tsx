
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Edit, Code, FileJson, FileCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Variable } from "../types";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { usePromptOperations } from "@/hooks/usePromptOperations";

interface FinalPromptDisplayProps {
  finalPrompt: string;
  updateFinalPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection?: (variableId: string, selectedText: string) => void;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  editablePrompt?: string;
  setEditablePrompt?: React.Dispatch<React.SetStateAction<string>>;
  handleSaveEditedPrompt?: () => void;
  renderTrigger?: number;
  setRenderTrigger?: React.Dispatch<React.SetStateAction<number>>;
  isRefreshing?: boolean;
  setIsRefreshing?: React.Dispatch<React.SetStateAction<boolean>>;
  lastSavedPrompt?: string;
  setLastSavedPrompt?: React.Dispatch<React.SetStateAction<string>>;
  jsonStructure?: any;
}

export const FinalPromptDisplay: React.FC<FinalPromptDisplayProps> = ({
  finalPrompt,
  updateFinalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
  showJson,
  masterCommand,
  handleOpenEditPrompt,
  recordVariableSelection,
  isEditing = false,
  setIsEditing = () => {},
  editablePrompt = "",
  setEditablePrompt = () => {},
  handleSaveEditedPrompt = () => {},
  renderTrigger = 0,
  setRenderTrigger = () => {},
  isRefreshing = false,
  setIsRefreshing = () => {},
  lastSavedPrompt = "",
  setLastSavedPrompt = () => {},
  jsonStructure
}) => {
  const { toast } = useToast();
  const [selectedText, setSelectedText] = useState("");
  const [activeTab, setActiveTab] = useState<string>("prompt-editor");
  const [jsonString, setJsonString] = useState<string>("");
  const [showFullJson, setShowFullJson] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const promptRef = useRef<HTMLDivElement>(null);
  const [internalJsonStructure, setInternalJsonStructure] = useState<any>(null);
  const { copyToClipboard } = useCopyToClipboard();

  // Set the active tab based on showJson prop
  useEffect(() => {
    setActiveTab(showJson ? "json-view" : "prompt-editor");
  }, [showJson]);

  // Update internal JSON structure when jsonStructure prop changes
  useEffect(() => {
    if (jsonStructure) {
      setInternalJsonStructure(jsonStructure);
      try {
        setJsonString(JSON.stringify(jsonStructure, null, 2));
      } catch (err) {
        console.error("Error stringifying JSON structure:", err);
      }
    }
  }, [jsonStructure]);

  // Force update of JSON display when renderTrigger changes
  useEffect(() => {
    if (showJson && renderTrigger > 0) {
      if (internalJsonStructure) {
        try {
          setJsonString(JSON.stringify(internalJsonStructure, null, 2));
        } catch (err) {
          console.error("Error in JSON stringify:", err);
          setJsonString("Error parsing JSON");
        }
      }
    }
  }, [renderTrigger, showJson, internalJsonStructure]);

  // If initialPrompt changes from outside this component, update it
  useEffect(() => {
    if (finalPrompt !== lastSavedPrompt) {
      setLastSavedPrompt(finalPrompt);
    }
  }, [finalPrompt, lastSavedPrompt, setLastSavedPrompt]);

  // Handle text selection in the prompt
  const handleTextSelect = useCallback(() => {
    if (promptRef.current && window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
      }
    }
  }, []);

  // Toggle expand/collapse of JSON sections
  const toggleSectionExpand = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // JSON view renderer
  const renderJsonView = useCallback(() => {
    if (isRefreshing) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-sm text-muted-foreground">Refreshing JSON...</span>
        </div>
      );
    }

    if (!internalJsonStructure) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <FileJson className="mx-auto h-12 w-12 mb-2 opacity-30" />
          <p>No JSON structure available. Toggle the JSON view to generate it.</p>
        </div>
      );
    }

    if (showFullJson) {
      return (
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute right-2 top-2 z-10"
            onClick={() => setShowFullJson(false)}
          >
            Show Formatted
          </Button>
          <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[500px] mt-2 font-mono">
            {jsonString}
          </pre>
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                copyToClipboard(jsonString);
                toast({
                  title: "Copied to clipboard",
                  description: "JSON structure copied",
                });
              }}
            >
              Copy JSON
            </Button>
          </div>
        </div>
      );
    }

    // Render formatted JSON view
    return (
      <div className="space-y-4 p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="float-right"
          onClick={() => setShowFullJson(true)}
        >
          Show Raw JSON
        </Button>
        
        <div className="clear-both">
          {internalJsonStructure.title && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{internalJsonStructure.title}</h3>
              {internalJsonStructure.summary && (
                <p className="text-sm text-muted-foreground mt-1">{internalJsonStructure.summary}</p>
              )}
            </div>
          )}
          
          {internalJsonStructure.sections && internalJsonStructure.sections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-accent-foreground">Sections</h4>
              {internalJsonStructure.sections.map((section: any, index: number) => (
                <div key={index} className="border rounded-md overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-muted cursor-pointer hover:bg-muted/80"
                    onClick={() => toggleSectionExpand(`section-${index}`)}
                  >
                    <h5 className="font-medium text-sm">{section.title}</h5>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedSections[`section-${index}`] ? '−' : '+'}
                    </Button>
                  </div>
                  {expandedSections[`section-${index}`] && (
                    <div className="p-3 text-sm whitespace-pre-wrap">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Display any additional fields as expandable sections */}
          {Object.keys(internalJsonStructure).filter(key => 
            !['title', 'summary', 'sections', 'timestamp', 'error', 'generationError'].includes(key) &&
            typeof internalJsonStructure[key] !== 'undefined' &&
            internalJsonStructure[key] !== null
          ).map((key) => (
            <div key={key} className="mt-4 border rounded-md overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 bg-muted cursor-pointer hover:bg-muted/80"
                onClick={() => toggleSectionExpand(key)}
              >
                <h5 className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {expandedSections[key] ? '−' : '+'}
                </Button>
              </div>
              {expandedSections[key] && (
                <div className="p-3 text-sm whitespace-pre-wrap">
                  {typeof internalJsonStructure[key] === 'object' 
                    ? JSON.stringify(internalJsonStructure[key], null, 2)
                    : String(internalJsonStructure[key])}
                </div>
              )}
            </div>
          ))}
          
          {internalJsonStructure.error && (
            <div className="mt-4 p-3 border border-destructive/30 bg-destructive/10 rounded-md">
              <h4 className="text-sm font-medium text-destructive">Error</h4>
              <p className="text-sm mt-1">{internalJsonStructure.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [internalJsonStructure, jsonString, isRefreshing, showFullJson, expandedSections, copyToClipboard, toast]);

  // Render the prompt editor
  const renderPromptEditor = useCallback(() => {
    if (isEditing) {
      return (
        <div className="mt-2">
          <Textarea
            value={editablePrompt}
            onChange={(e) => setEditablePrompt(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Enter your prompt here..."
          />
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditablePrompt("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSaveEditedPrompt}
            >
              Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="prose prose-sm max-w-none break-words relative"
        ref={promptRef}
        onMouseUp={handleTextSelect}
        dangerouslySetInnerHTML={{ __html: getProcessedPrompt() }}
      />
    );
  }, [isEditing, editablePrompt, setEditablePrompt, setIsEditing, handleSaveEditedPrompt, getProcessedPrompt, handleTextSelect]);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Final Prompt</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenEditPrompt}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {activeTab === "prompt-editor" ? (
          renderPromptEditor()
        ) : (
          renderJsonView()
        )}
      </CardContent>
    </Card>
  );
};
