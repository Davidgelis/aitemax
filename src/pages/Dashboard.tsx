
import { Search, User, Check, X, Copy, RotateCw, Save, MoreVertical, Trash, Pencil, Copy as CopyIcon, List, ListOrdered, Plus, Minus, ArrowLeft, ArrowRight, Edit, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
}

interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
}

interface SavedPrompt {
  id: string;
  title: string;
  date: string;
  promptText: string;
  masterCommand: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  variables: Variable[];
}

const primaryToggles = [
  { label: "Complex Reasoning", id: "complex" },
  { label: "Mathematical Problem-Solving", id: "math" },
  { label: "Coding", id: "coding" },
  { label: "Creating a copilot", id: "copilot" },
];

const secondaryToggles = [
  { label: "Token Saver prompt", id: "token" },
  { label: "Strict Response", id: "strict" },
  { label: "Creative", id: "creative" },
];

const loadingMessages = [
  "Pinpointing missing or unclear details",
  "Understanding contextual roles",
  "Identifying guidelines gaps, proper sequencing, and logical flows",
  "Generating next steps"
];

const mockQuestions: Question[] = [
  { id: "q1", text: "What specific aspects of complex reasoning are you interested in?", isRelevant: null, answer: "" },
  { id: "q2", text: "How would you like the output to be structured?", isRelevant: null, answer: "" },
  { id: "q3", text: "What is the target audience for this content?", isRelevant: null, answer: "" },
  { id: "q4", text: "What level of technical detail should be included?", isRelevant: null, answer: "" },
  { id: "q5", text: "Are there any specific examples you want included?", isRelevant: null, answer: "" },
  { id: "q6", text: "What's the primary goal of this content?", isRelevant: null, answer: "" },
  { id: "q7", text: "Any specific terminology or jargon to include or avoid?", isRelevant: null, answer: "" },
  { id: "q8", text: "What tone would you like the content to have?", isRelevant: null, answer: "" },
  { id: "q9", text: "Are there any length constraints?", isRelevant: null, answer: "" },
  { id: "q10", text: "Should there be a particular call-to-action?", isRelevant: null, answer: "" },
  { id: "q11", text: "Any specific sources or references to include?", isRelevant: null, answer: "" },
  { id: "q12", text: "What format would be most effective (list, narrative, etc.)?", isRelevant: null, answer: "" },
];

const defaultVariables: Variable[] = [
  { id: "v1", name: "Name", value: "David", isRelevant: true },
  { id: "v2", name: "Location", value: "Guate", isRelevant: true },
  { id: "v3", name: "Quantity", value: "4", isRelevant: true },
  { id: "v4", name: "Date", value: "", isRelevant: null },
  { id: "v5", name: "Category", value: "", isRelevant: null },
];

const sampleFinalPrompt = `# Expert Reasoning Framework for Complex Problem-Solving {{Quantity}}

## Initial Analysis Phase
Begin by breaking down the problem into its fundamental components. Identify key variables, constraints, and underlying patterns that might not be immediately obvious. Map the relationships between different elements and look for potential conflicts or synergies.

## Deep Exploration Phase
For each component identified, apply multiple mental models and disciplinary frameworks. Consider the problem from different perspectives (e.g., systems thinking, first principles reasoning, probabilistic thinking). Generate alternative hypotheses and evaluate them against available evidence.

## Synthesis and Solution Generation
Combine insights from different perspectives to form an integrated understanding. Develop multiple solution pathways rather than fixating on a single approach. Evaluate trade-offs explicitly and consider second-order consequences of each potential solution.

## Implementation and Feedback Integration
Outline a clear plan for putting the solution into practice, identifying potential {{Name}} contingency plans. Establish mechanisms to gather feedback and adjust the approach based on new information or changing conditions in {{Location}}.`;

const QUESTIONS_PER_PAGE = 3;

// Helper function to convert between Variable[] and Json
const variablesToJson = (variables: Variable[]): Json => {
  return variables as unknown as Json;
};

// Helper function to convert Json to Variable[]
const jsonToVariables = (json: Json | null): Variable[] => {
  if (!json) return [];
  // Ensure the Json is an array before casting
  if (Array.isArray(json)) {
    return json as Variable[];
  }
  return [];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>("coding");
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>("strict");
  const [currentStep, setCurrentStep] = useState(3);
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionPage, setCurrentQuestionPage] = useState(0);
  const [variables, setVariables] = useState<Variable[]>(defaultVariables);
  const [showJson, setShowJson] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState(sampleFinalPrompt);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [showEditPromptSheet, setShowEditPromptSheet] = useState(false);
  const [masterCommand, setMasterCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [user, setUser] = useState<any>(null);
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const variablesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editPromptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Check for authentication and get current user
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    // Get current session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch saved prompts from Supabase when user is available
  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
    }
  }, [user]);

  const fetchSavedPrompts = async () => {
    if (!user) return;
    
    setIsLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform data to match our SavedPrompt interface
      const formattedPrompts: SavedPrompt[] = data?.map(item => ({
        id: item.id,
        title: item.title || 'Untitled Prompt',
        date: new Date(item.created_at || '').toLocaleString(),
        promptText: item.prompt_text || '',
        masterCommand: item.master_command || '',
        primaryToggle: item.primary_toggle,
        secondaryToggle: item.secondary_toggle,
        variables: jsonToVariables(item.variables),
      })) || [];
      
      setSavedPrompts(formattedPrompts);
    } catch (error: any) {
      console.error("Error fetching prompts:", error.message);
      toast({
        title: "Error fetching prompts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const getProcessedPrompt = () => {
    let processedPrompt = finalPrompt;
    variables.forEach(variable => {
      if (variable.isRelevant && variable.name && variable.value) {
        const placeholder = `{{${variable.name}}}`;
        const highlightedValue = `<span class="bg-[#33fea6]/20 px-1 rounded border border-[#33fea6]/30">${variable.value}</span>`;
        processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), showJson ? variable.value : highlightedValue);
      }
    });
    return processedPrompt;
  };

  const handleVariableValueChange = (variableId: string, newValue: string) => {
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, value: newValue } : v
    ));
  };

  const handleNewPrompt = () => {
    setPromptText("");
    setQuestions([]);
    setVariables(defaultVariables.map(v => ({ ...v, value: "", isRelevant: null })));
    setFinalPrompt("");
    setMasterCommand("");
    setSelectedPrimary(null);
    setSelectedSecondary(null);
    setCurrentStep(1);
    
    toast({
      title: "New Prompt",
      description: "Started a new prompt creation process",
    });
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      if (currentLoadingMessage < loadingMessages.length) {
        timeout = setTimeout(() => {
          setCurrentLoadingMessage(prev => prev + 1);
        }, 3000);
      } else {
        setIsLoading(false);
        setCurrentLoadingMessage(0);
        setCurrentStep(2);
      }
    }
    return () => clearTimeout(timeout);
  }, [isLoading, currentLoadingMessage]);

  const handleOpenEditPrompt = () => {
    setEditingPrompt(finalPrompt);
    setShowEditPromptSheet(true);
  };

  const handleSaveEditedPrompt = () => {
    setFinalPrompt(editingPrompt);
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt updated successfully",
    });
  };

  const handleAdaptPrompt = () => {
    setFinalPrompt(editingPrompt);
    setShowEditPromptSheet(false);
    toast({
      title: "Success",
      description: "Prompt adapted successfully",
    });
  };

  const handlePrimaryToggle = (id: string) => {
    setSelectedPrimary(currentSelected => currentSelected === id ? null : id);
  };

  const handleSecondaryToggle = (id: string) => {
    setSelectedSecondary(currentSelected => currentSelected === id ? null : id);
  };

  const handleAnalyze = () => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setQuestions(mockQuestions);
    setCurrentQuestionPage(0);
    setSliderPosition(0);
  };

  const handleSavePrompt = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      const relevantVariables = variables.filter(v => v.isRelevant === true);
      const promptData = {
        user_id: user.id,
        title: finalPrompt.split('\n')[0] || 'Untitled Prompt',
        prompt_text: finalPrompt,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables: variablesToJson(relevantVariables),
        current_step: currentStep,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert(promptData)
        .select();

      if (error) {
        throw error;
      }

      // Add the new prompt to the start of the list
      if (data && data.length > 0) {
        const newPrompt: SavedPrompt = {
          id: data[0].id,
          title: data[0].title || 'Untitled Prompt',
          date: new Date(data[0].created_at || '').toLocaleString(),
          promptText: data[0].prompt_text || '',
          masterCommand: data[0].master_command || '',
          primaryToggle: data[0].primary_toggle,
          secondaryToggle: data[0].secondary_toggle,
          variables: jsonToVariables(data[0].variables),
        };
        
        setSavedPrompts([newPrompt, ...savedPrompts]);
      }

      toast({
        title: "Success",
        description: "Prompt saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving prompt:", error.message);
      toast({
        title: "Error saving prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, answer } : q
    ));
  };

  const handleQuestionRelevance = (questionId: string, isRelevant: boolean) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, isRelevant } : q
    ));
  };

  const handleVariableChange = (variableId: string, field: 'name' | 'value', content: string) => {
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, [field]: content } : v
    ));
  };

  const handleVariableRelevance = (variableId: string, isRelevant: boolean) => {
    setVariables(variables.map(v =>
      v.id === variableId ? { ...v, isRelevant } : v
    ));
  };

  const addVariable = () => {
    if (variables.length < 12) {
      const newId = `v${Date.now()}`;
      setVariables([...variables, { id: newId, name: "", value: "", isRelevant: null }]);
    } else {
      toast({
        title: "Limit reached",
        description: "You can add a maximum of 12 variables",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteVariable = (id: string) => {
    setVariableToDelete(id);
  };

  const removeVariable = () => {
    if (!variableToDelete) return;
    
    if (variables.length > 1) {
      setVariables(variables.filter(v => v.id !== variableToDelete));
      setVariableToDelete(null);
      toast({
        title: "Variable deleted",
        description: "The variable has been removed successfully",
      });
    } else {
      toast({
        title: "Cannot remove",
        description: "You need at least one variable",
        variant: "destructive",
      });
      setVariableToDelete(null);
    }
  };

  const allQuestionsAnswered = questions.every(q => q.isRelevant !== null);
  const allVariablesAnswered = variables.every(v => v.isRelevant !== null);

  const canProceedToStep3 = allQuestionsAnswered && allVariablesAnswered;

  const handleStepChange = (step: number) => {
    if (step === 2 && !promptText.trim()) {
      toast({
        title: "Cannot proceed",
        description: "Please enter a prompt before moving to step 2",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && questions.length === 0) {
      toast({
        title: "Cannot proceed",
        description: "Please analyze your prompt first",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && !canProceedToStep3) {
      toast({
        title: "Cannot proceed",
        description: "Please mark all questions and variables as relevant or not relevant",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(step);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(showJson ? JSON.stringify({ 
        prompt: finalPrompt, 
        masterCommand,
        variables: variables.filter(v => v.isRelevant === true)
      }, null, 2) : finalPrompt);
      
      toast({
        title: "Success",
        description: "Prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    toast({
      title: "Success",
      description: "Prompt regenerated successfully",
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

      const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== id);
      setSavedPrompts(updatedPrompts);
      
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

  const handleDuplicatePrompt = async (prompt: SavedPrompt) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to duplicate prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      const duplicateData = {
        user_id: user.id,
        title: `${prompt.title} (Copy)`,
        prompt_text: prompt.promptText,
        master_command: prompt.masterCommand,
        primary_toggle: prompt.primaryToggle,
        secondary_toggle: prompt.secondaryToggle,
        variables: variablesToJson(prompt.variables),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert(duplicateData)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newPrompt: SavedPrompt = {
          id: data[0].id,
          title: data[0].title,
          date: new Date(data[0].created_at || '').toLocaleString(),
          promptText: data[0].prompt_text || '',
          masterCommand: data[0].master_command || '',
          primaryToggle: data[0].primary_toggle,
          secondaryToggle: data[0].secondary_toggle,
          variables: jsonToVariables(data[0].variables),
        };
        
        setSavedPrompts([newPrompt, ...savedPrompts]);
      }
      
      toast({
        title: "Success",
        description: "Prompt duplicated successfully",
      });
    } catch (error: any) {
      console.error("Error duplicating prompt:", error.message);
      toast({
        title: "Error duplicating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRenamePrompt = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      const updatedPrompts = savedPrompts.map(prompt =>
        prompt.id === id ? { ...prompt, title: newTitle } : prompt
      );
      setSavedPrompts(updatedPrompts);
      
      toast({
        title: "Success",
        description: "Prompt renamed successfully",
      });
    } catch (error: any) {
      console.error("Error renaming prompt:", error.message);
      toast({
        title: "Error renaming prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const insertBulletList = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = promptText.substring(start, end);
    
    let newText;
    if (selected) {
      const lines = selected.split('\n');
      const bulletedLines = lines.map(line => line ? `• ${line}` : line);
      newText = promptText.substring(0, start) + bulletedLines.join('\n') + promptText.substring(end);
    } else {
      newText = promptText.substring(0, start) + '• ' + promptText.substring(end);
    }
    
    setPromptText(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }, 0);
    
    toast({
      title: "Added bullet list",
      description: "Bullet points have been added to your text",
    });
  };

  const insertNumberedList = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = promptText.substring(start, end);
    
    let newText;
    if (selected) {
      const lines = selected.split('\n');
      const numberedLines = lines.map((line, index) => line ? `${index + 1}. ${line}` : line);
      newText = promptText.substring(0, start) + numberedLines.join('\n') + promptText.substring(end);
    } else {
      newText = promptText.substring(0, start) + '1. ' + promptText.substring(end);
    }
    
    setPromptText(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + 3;
    }, 0);
    
    toast({
      title: "Added numbered list",
      description: "Numbers have been added to your text",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget;
      const { selectionStart } = textarea;
      const currentText = promptText;
      
      const textBeforeCursor = currentText.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      if (currentLine.trimStart().startsWith('• ')) {
        e.preventDefault();
        
        if (currentLine.trim() === '•' || currentLine.trim() === '• ') {
          const newLines = [...lines];
          newLines[newLines.length - 1] = '';
          const newText = newLines.join('\n') + currentText.substring(selectionStart);
          setPromptText(newText);
          
          setTimeout(() => {
            textarea.focus();
            const newCursorPosition = textBeforeCursor.length - currentLine.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
          }, 0);
        } else {
          const indent = currentLine.match(/^\s*/)?.[0] || '';
          const newLine = `\n${indent}• `;
          const newText = currentText.substring(0, selectionStart) + newLine + currentText.substring(selectionStart);
          setPromptText(newText);
          
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
          }, 0);
        }
        return;
      }
      
      const numberedListMatch = currentLine.trimStart().match(/^(\d+)\.\s/);
      if (numberedListMatch) {
        e.preventDefault();
        
        if (currentLine.trim() === `${numberedListMatch[1]}.` || currentLine.trim() === `${numberedListMatch[1]}. `) {
          const newLines = [...lines];
          newLines[newLines.length - 1] = '';
          const newText = newLines.join('\n') + currentText.substring(selectionStart);
          setPromptText(newText);
          
          setTimeout(() => {
            textarea.focus();
            const newCursorPosition = textBeforeCursor.length - currentLine.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
          }, 0);
        } else {
          const currentNumber = parseInt(numberedListMatch[1], 10);
          const indent = currentLine.match(/^\s*/)?.[0] || '';
          const newLine = `\n${indent}${currentNumber + 1}. `;
          const newText = currentText.substring(0, selectionStart) + newLine + currentText.substring(selectionStart);
          setPromptText(newText);
          
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
          }, 0);
        }
      }
    }
  };

  const filteredPrompts = savedPrompts.filter(prompt => 
    searchTerm === "" || 
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xl font-medium animate-fade-in">
            {loadingMessages[currentLoadingMessage]}
          </div>
          <div className="flex gap-2">
            {loadingMessages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentLoadingMessage ? 'bg-primary scale-125' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="fixed top-4 left-4 flex space-x-4 z-50">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => handleStepChange(step)}
                  className={`aurora-button text-2xl px-6 py-3 ${
                    currentStep === step ? 'bg-[#33fea6] text-accent font-semibold' : ''
                  }`}
                >
                  Step {step}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {primaryToggles.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <span className="text-sm text-card-foreground">{item.label}</span>
                  <Switch 
                    id={item.id}
                    checked={selectedPrimary === item.id}
                    onCheckedChange={() => handlePrimaryToggle(item.id)}
                    variant="primary"
                  />
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {secondaryToggles.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <span className="text-sm text-card-foreground">{item.label}</span>
                  <Switch 
                    id={item.id}
                    checked={selectedSecondary === item.id}
                    onCheckedChange={() => handleSecondaryToggle(item.id)}
                    variant="secondary"
                  />
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-6 bg-card min-h-[400px] relative">
              <div className="absolute top-6 right-6 flex space-x-2 z-10">
                <button
                  onClick={insertBulletList}
                  className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                  title="Add bullet list"
                >
                  <List className="w-5 h-5" style={{ color: "#64bf95" }} />
                </button>
                <button
                  onClick={insertNumberedList}
                  className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                  title="Add numbered list"
                >
                  <ListOrdered className="w-5 h-5" style={{ color: "#64bf95" }} />
                </button>
              </div>
              <textarea 
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-[280px] bg-transparent resize-none outline-none text-card-foreground placeholder:text-muted-foreground"
                placeholder="Start by typing your prompt"
              />
              <div className="absolute bottom-6 right-6">
                <button 
                  onClick={handleAnalyze}
                  className="aurora-button"
                >
                  Analyze
                </button>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <div className="border rounded-xl p-6 bg-card">
            <div className="fixed top-4 left-4 flex space-x-4 z-50">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => handleStepChange(step)}
                  className={`aurora-button text-2xl px-6 py-3 ${
                    currentStep === step ? 'bg-[#33fea6] text-accent font-semibold' : ''
                  }`}
                >
                  Step {step}
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <p className="text-card-foreground mb-4">
                Answer the following questions to enhance your prompt, mark them as relevant or not relevant
              </p>
              
              <div 
                ref={questionsContainerRef}
                className="max-h-[285px] overflow-y-auto pr-2 space-y-4"
              >
                {questions.map((question) => (
                  <div key={question.id} className="p-4 border rounded-lg bg-background">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-card-foreground">{question.text}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuestionRelevance(question.id, false)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              question.isRelevant === false ? 'bg-[#33fea6]' : ''
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQuestionRelevance(question.id, true)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              question.isRelevant === true ? 'bg-[#33fea6]' : ''
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {question.isRelevant && (
                        <textarea
                          value={question.answer}
                          onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-card-foreground">Variables</p>
                <button
                  onClick={addVariable}
                  className="flex items-center gap-2 aurora-button"
                >
                  <Plus className="w-4 h-4" /> Add Variable
                </button>
              </div>
              
              <div 
                ref={variablesContainerRef}
                className="max-h-[285px] overflow-y-auto pr-2 space-y-4"
              >
                {variables.map((variable) => (
                  <div key={variable.id} className="p-4 border rounded-lg bg-background">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={variable.name}
                            onChange={(e) => handleVariableChange(variable.id, 'name', e.target.value)}
                            placeholder="Variable name"
                            className="w-1/3 p-2 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            value={variable.value}
                            onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-2/3 p-2 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleVariableRelevance(variable.id, false)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              variable.isRelevant === false ? 'bg-[#33fea6]' : ''
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVariableRelevance(variable.id, true)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              variable.isRelevant === true ? 'bg-[#33fea6]' : ''
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => confirmDeleteVariable(variable.id)}
                            className="p-2 rounded-full hover:bg-red-100"
                          >
                            <Trash className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={() => handleStepChange(3)}
                disabled={!canProceedToStep3}
                className="aurora-button"
              >
                Next: Review & Copy
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="border rounded-xl p-6 bg-card">
            <div className="fixed top-4 left-4 flex space-x-4 z-50">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => handleStepChange(step)}
                  className={`aurora-button text-2xl px-6 py-3 ${
                    currentStep === step ? 'bg-[#33fea6] text-accent font-semibold' : ''
                  }`}
                >
                  Step {step}
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-card-foreground">Final Prompt</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-card-foreground">Show as JSON</span>
                    <Switch 
                      checked={showJson}
                      onCheckedChange={setShowJson}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenEditPrompt}
                      className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                      title="Edit Prompt"
                    >
                      <Edit className="w-5 h-5" style={{ color: "#64bf95" }} />
                    </button>
                    <button
                      onClick={handleCopyPrompt}
                      className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                      title="Copy Prompt"
                    >
                      <Copy className="w-5 h-5" style={{ color: "#64bf95" }} />
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                      title="Regenerate Prompt"
                    >
                      <RotateCw className="w-5 h-5" style={{ color: "#64bf95" }} />
                    </button>
                    <button
                      onClick={handleSavePrompt}
                      className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                      title="Save Prompt"
                    >
                      <Save className="w-5 h-5" style={{ color: "#64bf95" }} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div 
                className="p-6 border rounded-lg bg-background text-card-foreground min-h-[300px] max-h-[500px] overflow-y-auto whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: showJson 
                    ? `<pre>${JSON.stringify({ 
                      prompt: finalPrompt, 
                      masterCommand,
                      variables: variables.filter(v => v.isRelevant === true)
                    }, null, 2)}</pre>` 
                    : getProcessedPrompt()
                }}
              />
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-card-foreground">Master Command</h4>
                </div>
                <textarea 
                  value={masterCommand}
                  onChange={(e) => setMasterCommand(e.target.value)}
                  placeholder="Add a master command (optional)..."
                  className="w-full p-4 border rounded-lg bg-background text-card-foreground placeholder:text-muted-foreground min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="text-xl font-medium">Welcome to Aitema X Prompt Builder</div>
              <div className="fixed top-4 left-4 flex space-x-4 z-50">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => handleStepChange(step)}
                    className={`aurora-button text-2xl px-6 py-3 ${
                      currentStep === step ? 'bg-[#33fea6] text-accent font-semibold' : ''
                    }`}
                  >
                    Step {step}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handleStepChange(1)}
                className="aurora-button"
              >
                Start Building
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#fafafa]">
        <Sidebar>
          <SidebarTrigger className="fixed top-4 right-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200">
            <User className="h-5 w-5" />
          </SidebarTrigger>
          <SidebarContent className="w-80 p-4 bg-white border-l">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Saved Prompts</h3>
                <button 
                  onClick={handleNewPrompt}
                  className="aurora-button flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search prompts..."
                  className="pl-10"
                />
              </div>
              {isLoadingPrompts ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredPrompts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No prompts found
                    </div>
                  ) : (
                    filteredPrompts.map((prompt) => (
                      <div 
                        key={prompt.id}
                        className="p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{prompt.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-accent/10 rounded">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicatePrompt(prompt)}>
                                <CopyIcon className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeletePrompt(prompt.id)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {prompt.date}
                        </div>
                        <div className="mt-2 text-xs truncate text-muted-foreground">
                          {prompt.promptText.substring(0, 60)}...
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 p-8 pt-20"> 
          {renderContent()}
        </div>
      </div>
      
      <AlertDialog open={variableToDelete !== null} onOpenChange={(open) => !open && setVariableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variable? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeVariable}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Sheet open={showEditPromptSheet} onOpenChange={setShowEditPromptSheet}>
        <SheetContent className="w-full md:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>Edit Prompt</SheetTitle>
            <SheetDescription>
              Make changes to the prompt before finalizing.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <textarea
              ref={editPromptTextareaRef}
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="w-full min-h-[500px] p-4 border rounded-lg bg-background text-card-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <button className="aurora-button">
                Cancel
              </button>
            </SheetClose>
            <button
              onClick={handleSaveEditedPrompt}
              className="aurora-button"
            >
              Save changes
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
};

export default Dashboard;
