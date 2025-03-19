import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Edit, Check, Download, RefreshCw, Plus, Trash, MoreVertical, CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { usePromptState } from "@/hooks/usePromptState";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { primaryToggles, secondaryToggles } from "@/components/dashboard/constants";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  PopoverAnchor,
} from "@radix-ui/react-popover"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
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
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PromptJsonStructure, Variable } from "../types";
import { jsonToVariables } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { useCompletion } from 'ai/react';
import { useQuestionsAndVariables } from "@/hooks/useQuestionsAndVariables";

interface DataTableProps {
  data: any[]
}

export function DataTable({
  data,
}: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.invoice}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.method}</TableCell>
              <TableCell className="text-right">{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

function PromptVariable({ variable, handleVariableChange, handleVariableRelevance }: any) {
  return (
    <div key={variable.id} className="grid gap-2 py-2">
      <div className="grid grid-cols-[100px_2fr_1fr] items-center gap-4">
        <Label htmlFor={variable.id}>{variable.name || 'New Variable'}</Label>
        <Input
          id={variable.id}
          value={variable.value}
          onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
          className="h-8"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVariableRelevance(variable.id, !variable.isRelevant)}
        >
          {variable.isRelevant === true ? 'Relevant' : 'Irrelevant'}
        </Button>
      </div>
    </div>
  );
}

// Define props interface for FinalPromptDisplay
interface FinalPromptDisplayProps {
  finalPrompt: string;
  updateFinalPrompt: (prompt: string) => void;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
  recordVariableSelection: (variableId: string, selectedText: string) => void;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  editablePrompt: string;
  setEditablePrompt: React.Dispatch<React.SetStateAction<string>>;
  handleSaveEditedPrompt: () => void;
  renderTrigger: number;
  setRenderTrigger: React.Dispatch<React.SetStateAction<number>>;
  isRefreshing: boolean;
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  lastSavedPrompt: string;
  setLastSavedPrompt: React.Dispatch<React.SetStateAction<string>>;
}

export function FinalPromptDisplay({
  finalPrompt,
  updateFinalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
  showJson,
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
}: FinalPromptDisplayProps) {
  const {
    promptText,
    setPromptText,
    questions,
    setQuestions,
    variables: promptStateVariables,
    setVariables: setPromptStateVariables,
    finalPrompt: promptStateFinalPrompt,
    setFinalPrompt: setPromptStateFinalPrompt,
    masterCommand: promptStateMasterCommand,
    setMasterCommand: setPromptStateMasterCommand,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    showEditPromptSheet,
    setShowEditPromptSheet,
    handleSavePrompt,
    loadSavedPrompt,
    isViewingSavedPrompt,
    setIsViewingSavedPrompt,
    promptJsonStructure,
    setPromptJsonStructure,
    isPrivate,
    setIsPrivate
  } = usePromptState();
  const { toast } = useToast();
  const promptRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLocalJson, setShowLocalJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isGeneratingJson, setIsGeneratingJson] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  
  // Using window.location for navigation instead of next/router
  const navigate = (path: string) => {
    window.location.href = path;
  };

  // Create a mock user object to avoid clerk errors
  const user = { id: 'anonymous-user' };

  const {
    handleQuestionAnswer,
    handleQuestionRelevance,
    handleVariableChange,
    handleVariableRelevance,
    addVariable,
    removeVariable,
    canProceedToStep3,
    enhancePromptWithGPT,
    isEnhancing,
    prepareDataForEnhancement
  } = useQuestionsAndVariables(
    questions,
    setQuestions,
    promptStateVariables,
    setPromptStateVariables,
    variableToDelete,
    setVariableToDelete,
    user
  );

  const { theme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { complete, completion, setInput, stop, isLoading: isAICompleting } = useCompletion({
    api: '/api/completion',
    onError: (error) => {
      console.error('Completion error:', error);
      toast({
        title: "AI Completion Error",
        description: "There was an error generating the completion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditPrompt = () => {
    setShowEditPromptSheet(true);
  };

  const handlePromptTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };

  const copyToClipboard = async () => {
    if (promptRef.current) {
      try {
        await navigator.clipboard.writeText(promptRef.current.innerText);
        setIsCopied(true);
        toast({
          title: "Copied!",
          description: "Prompt copied to clipboard.",
        });
        setTimeout(() => setIsCopied(false), 3000); // Reset after 3 seconds
      } catch (err) {
        console.error("Failed to copy text: ", err);
        toast({
          title: "Error",
          description: "Failed to copy prompt to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const downloadPrompt = () => {
    setIsDownloading(true);
    const element = document.createElement("a");
    const file = new Blob([finalPrompt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "prompt.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Downloaded!",
      description: "Prompt downloaded as prompt.txt.",
    });
    setIsDownloading(false);
  }

  const handleTogglePrimary = (value: string) => {
    setSelectedPrimary(selectedPrimary === value ? null : value);
  };

  const handleToggleSecondary = (value: string) => {
    setSelectedSecondary(selectedSecondary === value ? null : value);
  };

  const handleEnhancePrompt = async () => {
    if (!promptText || promptText.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a prompt to enhance.",
        variant: "destructive",
      });
      return;
    }

    // Fix: Pass an empty object to prepareDataForEnhancement to match its expected signature
    const { updatedQuestions, updatedVariables } = prepareDataForEnhancement({});
    setQuestions(updatedQuestions);
    setPromptStateVariables(updatedVariables);

    // Call the enhancePromptWithGPT function
    enhancePromptWithGPT(promptText, selectedPrimary, selectedSecondary, setPromptStateFinalPrompt);
  };

  const handleGenerateJson = async () => {
    if (!finalPrompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt to convert to JSON.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingJson(true);
    setJsonError(null);

    try {
      const response = await fetch('/api/prompt-to-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, masterCommand, userId: user?.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setPromptJsonStructure(data.jsonStructure);
        toast({
          title: "Success",
          description: "Prompt converted to JSON successfully!",
        });
      } else {
        setJsonError(data.error || 'Failed to convert prompt to JSON.');
        toast({
          title: "Error",
          description: data.error || 'Failed to convert prompt to JSON.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error converting prompt to JSON:", error);
      setJsonError(error.message || 'An unexpected error occurred.');
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingJson(false);
    }
  };

  // This dummy variable includes the description field
  const dummyVariable = { 
    id: "sample", 
    name: "Sample", 
    description: "Sample description", 
    value: "", 
    isRelevant: true, 
    category: "test" 
  };

  return (
    <div className="container relative pb-4">
      <DashboardHeader
        title="Final Prompt"
        description="Review and refine your prompt before saving."
      />

      <div className="grid gap-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Master Command</CardTitle>
            <CardDescription>
              This is the core instruction that guides the AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write your master command here..."
              value={masterCommand}
              onChange={(e) => setPromptStateMasterCommand(e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              Answer these questions to provide more context to the AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {questions.map((question) => (
                <div key={question.id} className="grid gap-2">
                  <Label htmlFor={question.id}>{question.text}</Label>
                  <Input
                    id={question.id}
                    value={question.answer || ""}
                    onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                    placeholder="Your answer"
                    className="h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuestionRelevance(question.id, !question.isRelevant)}
                  >
                    {question.isRelevant === true ? 'Relevant' : 'Irrelevant'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>
              Define variables to make your prompt more dynamic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {promptStateVariables.map((variable) => (
                <PromptVariable
                  key={variable.id}
                  variable={variable}
                  handleVariableChange={handleVariableChange}
                  handleVariableRelevance={handleVariableRelevance}
                />
              ))}
              <Button variant="secondary" size="sm" onClick={addVariable}>
                Add Variable
              </Button>
              {variableToDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Variable
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the variable and remove it from your prompt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeVariable()}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primary Toggle</CardTitle>
            <CardDescription>
              Select a primary toggle to apply a specific focus to your prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup type="single" value={selectedPrimary} onValueChange={handleTogglePrimary}>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                {primaryToggles.map((toggle) => (
                  <ToggleGroupItem key={toggle.id} value={toggle.id} aria-label={toggle.label} className="h-10">
                    {toggle.label}
                  </ToggleGroupItem>
                ))}
              </div>
            </ToggleGroup>
            {selectedPrimary && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">
                  {primaryToggles.find((toggle) => toggle.id === selectedPrimary)?.label} Definition
                </h4>
                <p className="text-sm text-muted-foreground">
                  {primaryToggles.find((toggle) => toggle.id === selectedPrimary)?.definition}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secondary Toggle</CardTitle>
            <CardDescription>
              Select a secondary toggle to further refine your prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup type="single" value={selectedSecondary} onValueChange={handleToggleSecondary}>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                {secondaryToggles.map((toggle) => (
                  <ToggleGroupItem key={toggle.id} value={toggle.id} aria-label={toggle.label} className="h-10">
                    {toggle.label}
                  </ToggleGroupItem>
                ))}
              </div>
            </ToggleGroup>
            {selectedSecondary && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">
                  {secondaryToggles.find((toggle) => toggle.id === selectedSecondary)?.label} Definition
                </h4>
                <p className="text-sm text-muted-foreground">
                  {secondaryToggles.find((toggle) => toggle.id === selectedSecondary)?.definition}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Final Prompt</CardTitle>
            <CardDescription>
              This is the final prompt that will be sent to the AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Your final prompt will appear here..."
              value={finalPrompt}
              onChange={(e) => updateFinalPrompt(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleEnhancePrompt} disabled={isEnhancing}>
              {isEnhancing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                "Enhance Prompt"
              )}
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={isCopied}>
                {isCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPrompt} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSON Structure</CardTitle>
            <CardDescription>
              View and generate the JSON structure of your prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="secondary" onClick={handleGenerateJson} disabled={isGeneratingJson}>
                {isGeneratingJson ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating JSON...
                  </>
                ) : (
                  "Generate JSON"
                )}
              </Button>
              {jsonError && (
                <div className="text-red-500">Error: {jsonError}</div>
              )}
              {promptJsonStructure ? (
                <div className="border rounded-md p-2 bg-muted">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(promptJsonStructure, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">No JSON structure generated yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>
              Make this prompt private so only you can see it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="private">Make this prompt private</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button onClick={handleSavePrompt}>Save Prompt</Button>
      </div>
    </div>
  );
}
