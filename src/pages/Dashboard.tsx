
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
    // Cast each item in the array to ensure it has the correct structure
    return json.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: (item as any).id || `v${Date.now()}`,
          name: (item as any).name || '',
          value: (item as any).value || '',
          isRelevant: (item as any).isRelevant === true
        } as Variable;
      }
      // Return a default variable if item is not an object
      return { id: `v${Date.now()}`, name: '', value: '', isRelevant: null } as Variable;
    });
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
            
            <div className="border rounded-xl p-6 bg-card">
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
                        
                        {question.isRelevant === true && (
                          <div className="mt-2">
                            <textarea
                              value={question.answer}
                              onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                              className="w-full p-2 rounded border bg-background resize-none h-20 outline-none focus:border-[#33fea6]"
                              placeholder="Your answer here..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Variables</h3>
                <div
                  ref={variablesContainerRef}
                  className="max-h-[200px] overflow-y-auto pr-2 space-y-4"
                >
                  {variables.map((variable) => (
                    <div key={variable.id} className="p-4 border rounded-lg bg-background">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            value={variable.name}
                            onChange={(e) => handleVariableChange(variable.id, 'name', e.target.value)}
                            placeholder="Variable name"
                            className="mb-2 focus:border-[#33fea6]"
                          />
                          <Input
                            value={variable.value}
                            onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="focus:border-[#33fea6]"
                          />
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col justify-center">
                          <button
                            onClick={() => handleVariableRelevance(variable.id, false)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              variable.isRelevant === false ? 'bg-[#33fea6]' : ''
                            }`}
                            title="Not relevant"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVariableRelevance(variable.id, true)}
                            className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                              variable.isRelevant === true ? 'bg-[#33fea6]' : ''
                            }`}
                            title="Relevant"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => confirmDeleteVariable(variable.id)}
                            className="p-2 rounded-full hover:bg-red-500/20 text-red-500"
                            title="Delete variable"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-4">
                  <button 
                    onClick={addVariable}
                    className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Variable</span>
                  </button>
                  
                  <button
                    onClick={() => handleStepChange(3)}
                    disabled={!canProceedToStep3}
                    className={`aurora-button ${!canProceedToStep3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Generate Prompt
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      case 3:
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="border rounded-xl p-6 bg-card">
                  <h3 className="text-lg font-medium mb-4">Master Command</h3>
                  <textarea
                    value={masterCommand}
                    onChange={(e) => setMasterCommand(e.target.value)}
                    className="w-full p-3 rounded border bg-background resize-none h-20 outline-none focus:border-[#33fea6]"
                    placeholder="Enter a master command (optional)"
                  />
                </div>
                
                <div className="border rounded-xl p-6 bg-card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Final Prompt</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowJson(!showJson)}
                        className={`p-2 rounded-md hover:bg-accent/20 transition-colors ${
                          showJson ? 'bg-accent/20' : ''
                        }`}
                        title={showJson ? "Show formatted" : "Show as JSON"}
                      >
                        <FileText className="w-5 h-5" style={{ color: "#64bf95" }} />
                      </button>
                      <button
                        onClick={handleOpenEditPrompt}
                        className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                        title="Edit prompt"
                      >
                        <Edit className="w-5 h-5" style={{ color: "#64bf95" }} />
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                        title="Regenerate"
                      >
                        <RotateCw className="w-5 h-5" style={{ color: "#64bf95" }} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border rounded p-4 bg-background min-h-[300px] mb-4 overflow-auto whitespace-pre-wrap">
                    {showJson ? (
                      <pre className="text-left">
                        {JSON.stringify({
                          prompt: finalPrompt,
                          masterCommand,
                          variables: variables.filter(v => v.isRelevant === true)
                        }, null, 2)}
                      </pre>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{ __html: getProcessedPrompt() }}
                        className="text-left"
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    
                    <button
                      onClick={handleSavePrompt}
                      className="aurora-button"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Prompt
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="border rounded-xl p-6 bg-card sticky top-20">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span>{user ? user.email : 'Guest'}</span>
                    </div>
                    <button
                      onClick={handleNewPrompt}
                      className="aurora-button"
                    >
                      New Prompt
                    </button>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="mb-4">
                    <Input
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="focus:border-[#33fea6]"
                      prefix={<Search className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {isLoadingPrompts ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filteredPrompts.length > 0 ? (
                      filteredPrompts.map((prompt) => (
                        <div key={prompt.id} className="border rounded-lg p-3 bg-background">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{prompt.title}</h4>
                              <p className="text-xs text-muted-foreground">{prompt.date}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-accent/20">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicatePrompt(prompt)}>
                                  <CopyIcon className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const newTitle = prompt.title === 'Untitled Prompt' ? '' : prompt.title;
                                  const title = window.prompt('Enter new title:', newTitle);
                                  if (title) handleRenamePrompt(prompt.id, title);
                                }}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this prompt?')) {
                                      handleDeletePrompt(prompt.id);
                                    }
                                  }}
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'No matching prompts found' : 'No saved prompts yet'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="container mx-auto py-8 px-4">
        {renderContent()}
      </div>
      
      <AlertDialog open={!!variableToDelete} onOpenChange={() => setVariableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeVariable}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Sheet open={showEditPromptSheet} onOpenChange={setShowEditPromptSheet}>
        <SheetContent className="w-[90vw] sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Prompt</SheetTitle>
            <SheetDescription>
              Make changes to your prompt template
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <textarea
              ref={editPromptTextareaRef}
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="w-full h-[50vh] p-3 border rounded resize-none focus:outline-none focus:border-[#33fea6]"
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSaveEditedPrompt}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
};

export default Dashboard;
