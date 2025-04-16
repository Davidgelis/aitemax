
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PromptJsonStructure, Variable } from '../types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Copy, Edit, CheckCircle2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Update the props interface to match what's used in StepThreeContent
interface FinalPromptDisplayProps {
  finalPrompt: string;
  setFinalPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection: (variableId: string, selectedText: string) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  editablePrompt: string;
  setEditablePrompt: (prompt: string) => void;
  handleSaveEditedPrompt: () => void;
  renderTrigger: number;
  setRenderTrigger: (trigger: number) => void;
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
  lastSavedPrompt: string;
  setLastSavedPrompt: (prompt: string) => void;
}

export const FinalPromptDisplay = ({
  finalPrompt,
  setFinalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
  masterCommand,
  handleOpenEditPrompt,
  recordVariableSelection,
  isEditing,
  setIsEditing,
  editablePrompt,
  setEditablePrompt,
  handleSaveEditedPrompt,
  renderTrigger,
  setRenderTrigger,
  isRefreshing,
  setIsRefreshing,
  lastSavedPrompt,
  setLastSavedPrompt
}: FinalPromptDisplayProps) => {
  const [promptTitle, setPromptTitle] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [promptJsonStructure, setPromptJsonStructure] = useState<PromptJsonStructure | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAdaptationSheet, setShowAdaptationSheet] = useState(false);
  const [adaptationText, setAdaptationText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempPromptTitle, setTempPromptTitle] = useState("");
  const [showMasterCommand, setShowMasterCommand] = useState(true);
  const [showToggles, setShowToggles] = useState(true);

  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempPromptTitle(e.target.value);
  };

  const handleTitleSave = () => {
    setPromptTitle(tempPromptTitle);
    setIsEditingTitle(false);
    
    // Update the JSON structure with the new title if needed
    if (promptJsonStructure) {
      setPromptJsonStructure({
        ...promptJsonStructure,
        title: tempPromptTitle,
        summary: promptJsonStructure.summary
      });
    }
  };

  const handleTitleEdit = () => {
    setTempPromptTitle(promptTitle);
    setIsEditingTitle(true);
  };

  const handleCopy = () => {
    
  };

  const handleSave = async () => {
    
  };

  const handleAdaptation = async () => {
    
  };

  const handleRegeneratePrompt = async () => {
    
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    
  };

  const handleToggleChange = () => {
    
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
  };

  const handleAdaptationTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdaptationText(e.target.value);
  };

  const handleAdaptationSheetOpen = () => {
    setShowAdaptationSheet(true);
  };

  const handleAdaptationSheetClose = () => {
    setShowAdaptationSheet(false);
  };

  const processedPrompt = getProcessedPrompt();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {isEditingTitle ? (
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={tempPromptTitle}
              onChange={handleTitleChange}
              placeholder="Enter prompt title"
              className="max-w-sm"
            />
            <Button onClick={handleTitleSave} size="sm">
              Save
            </Button>
          </div>
        ) : (
          <h2 className="text-2xl font-bold">{promptTitle || "Final Prompt"}</h2>
        )}
        <div>
          {!isEditingTitle && (
            <Button onClick={handleTitleEdit} variant="ghost" size="sm" className="mr-2">
              <Edit className="h-4 w-4 mr-2" />
              Edit Title
            </Button>
          )}
          <Button onClick={handleCopy} disabled={isCopied} size="sm">
            {isCopied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? "Saving..." : "Save Prompt"}
        </Button>
        <Button onClick={handleRegeneratePrompt} disabled={isRegenerating} size="sm">
          {isRegenerating ? (
            "Regenerating..."
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Regenerate
            </>
          )}
        </Button>
        <Button onClick={handleAdaptationSheetOpen} disabled={isAdapting} size="sm">
          {isAdapting ? "Adapting..." : "Adapt Prompt"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="prompt-text" className="text-sm font-medium">
            Final Prompt Text
          </label>
          <div className="flex items-center space-x-2">
            <label htmlFor="show-json" className="text-sm font-medium">
              Show JSON
            </label>
            <Switch id="show-json" checked={false} onCheckedChange={handleToggleChange} />
          </div>
        </div>
        <Textarea
          id="prompt-text"
          value={processedPrompt}
          onChange={handleTextareaChange}
          className="w-full h-48 resize-none"
          ref={textareaRef}
        />
      </div>

      {/* This was always falsy: false && (...) - Changed to a comment for now */}
      {/* JSON Structure section (uncomment and fix if needed) */}

      <Sheet open={showAdaptationSheet} onOpenChange={setShowAdaptationSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Adaptation Settings</SheetTitle>
            <SheetDescription>
              Customize the prompt adaptation process with specific instructions.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="adaptation-text" className="text-right">
                Adaptation Instructions
              </label>
              <Textarea
                id="adaptation-text"
                value={adaptationText}
                onChange={handleAdaptationTextChange}
                className="col-span-3"
                placeholder="Enter instructions for adapting the prompt"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="adaptation-strength" className="text-right">
                Adaptation Strength
              </label>
              <Slider
                id="adaptation-strength"
                defaultValue={[sliderValue]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleAdaptation}>
              Adapt Prompt
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
