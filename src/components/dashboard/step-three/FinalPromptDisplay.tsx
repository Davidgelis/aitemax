import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { PromptJsonStructure } from '../types';

interface FinalPromptDisplayProps {
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  finalPrompt: string;
  setFinalPrompt: (prompt: string) => void;
  variables: any[];
  setVariables: (variables: any[]) => void;
  handleVariableValueChange: (variableId: string, newValue: string) => void;
  handleCopyPrompt: () => void;
  handleSavePrompt: () => Promise<void>;
  handleRegenerate: () => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;
  showEditPromptSheet: boolean;
  setShowEditPromptSheet: (show: boolean) => void;
  handleOpenEditPrompt: () => void;
  handleSaveEditedPrompt: () => void;
  handleAdaptPrompt: () => void;
  getProcessedPrompt: () => string;
}

export const FinalPromptDisplay = ({
  masterCommand,
  setMasterCommand,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  showJson,
  setShowJson,
  finalPrompt,
  setFinalPrompt,
  variables,
  setVariables,
  handleVariableValueChange,
  handleCopyPrompt,
  handleSavePrompt,
  handleRegenerate,
  editingPrompt,
  setEditingPrompt,
  showEditPromptSheet,
  setShowEditPromptSheet,
  handleOpenEditPrompt,
  handleSaveEditedPrompt,
  handleAdaptPrompt,
  getProcessedPrompt
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
  };

  const handleTitleEdit = () => {
    setTempPromptTitle(promptTitle);
    setIsEditingTitle(true);
  };

  const handleCopy = () => {
    handleCopyPrompt();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await handleSavePrompt();
      toast({
        title: "Prompt Saved",
        description: "Your prompt has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Prompt",
        description: "Failed to save the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdaptation = async () => {
    setIsAdapting(true);
    try {
      await handleAdaptPrompt();
      toast({
        title: "Prompt Adapted",
        description: "Your prompt has been adapted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Adapting Prompt",
        description: "Failed to adapt the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdapting(false);
    }
  };

  const handleRegeneratePrompt = async () => {
    setIsRegenerating(true);
    try {
      await handleRegenerate();
      toast({
        title: "Prompt Regenerated",
        description: "Your prompt has been regenerated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Regenerating Prompt",
        description: "Failed to regenerate the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFinalPrompt(e.target.value);
  };

  const handleToggleChange = () => {
    setShowJson(!showJson);
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
            <Switch id="show-json" checked={showJson} onCheckedChange={handleToggleChange} />
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

      {showJson && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">JSON Structure</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="masterCommand">
              <AccordionTrigger>Master Command</AccordionTrigger>
              <AccordionContent>
                <Input
                  type="text"
                  value={masterCommand}
                  onChange={(e) => setMasterCommand(e.target.value)}
                  placeholder="Enter master command"
                  className="w-full"
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="toggles">
              <AccordionTrigger>Toggles</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="flex items-center space-x-4">
                  <label htmlFor="primary-toggle" className="text-sm font-medium">
                    Primary Toggle
                  </label>
                  <Input
                    type="text"
                    id="primary-toggle"
                    value={selectedPrimary || ""}
                    className="w-full"
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label htmlFor="secondary-toggle" className="text-sm font-medium">
                    Secondary Toggle
                  </label>
                  <Input
                    type="text"
                    id="secondary-toggle"
                    value={selectedSecondary || ""}
                    className="w-full"
                    disabled
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="variables">
              <AccordionTrigger>Variables</AccordionTrigger>
              <AccordionContent>
                {variables.map((variable) => (
                  <div key={variable.id} className="flex items-center space-x-4 mb-2">
                    <label htmlFor={`variable-${variable.id}`} className="text-sm font-medium">
                      {variable.name}
                    </label>
                    <Input
                      type="text"
                      id={`variable-${variable.id}`}
                      value={variable.value}
                      onChange={(e) => handleVariableValueChange(variable.id, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

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
