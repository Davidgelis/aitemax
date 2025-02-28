
import { Search, User, Check, X, Copy, RotateCw, Save, MoreVertical, Trash, Pencil, Copy as CopyIcon, List, ListOrdered, Plus, Minus, ArrowLeft, ArrowRight } from "lucide-react";
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
  { id: "v1", name: "Name", value: "", isRelevant: null },
  { id: "v2", name: "Location", value: "", isRelevant: null },
  { id: "v3", name: "Quantity", value: "", isRelevant: null },
];

const QUESTIONS_PER_PAGE = 3;

const Dashboard = () => {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionPage, setCurrentQuestionPage] = useState(0);
  const [variables, setVariables] = useState<Variable[]>(defaultVariables);
  const [showJson, setShowJson] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [masterCommand, setMasterCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Calculate total pages for questions pagination
  const totalQuestionPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  
  // Calculate max slider height
  const maxSliderHeight = questions.length > 0 ? 100 : 0;
  
  // Calculate slider thumb position
  const sliderThumbPosition = (sliderPosition / 100) * maxSliderHeight;

  useEffect(() => {
    const saved = localStorage.getItem("savedPrompts");
    if (saved) {
      setSavedPrompts(JSON.parse(saved));
    }
  }, []);

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

  // Effect to handle scrolling based on slider position
  useEffect(() => {
    if (questionsContainerRef.current && questions.length > 0) {
      const container = questionsContainerRef.current;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const scrollPosition = (sliderPosition / 100) * scrollHeight;
      container.scrollTop = scrollPosition;
    }
  }, [sliderPosition, questions]);

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

  const handleSliderDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (questions.length === 0) return;
    
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const newPosition = Math.max(0, Math.min(100, (offsetY / rect.height) * 100));
    setSliderPosition(newPosition);
  };

  const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (questions.length === 0) return;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const slider = e.currentTarget;
      const rect = slider.getBoundingClientRect();
      const offsetY = moveEvent.clientY - rect.top;
      const newPosition = Math.max(0, Math.min(100, (offsetY / rect.height) * 100));
      setSliderPosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleContainerScroll = () => {
    if (questionsContainerRef.current && questions.length > 0) {
      const container = questionsContainerRef.current;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const scrollPosition = container.scrollTop;
      const newSliderPosition = (scrollPosition / scrollHeight) * 100;
      setSliderPosition(newSliderPosition);
    }
  };

  const handleSavePrompt = () => {
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      title: finalPrompt.split('\n')[0] || 'Untitled Prompt',
      date: new Date().toLocaleString(),
      promptText: finalPrompt,
      masterCommand,
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary,
      variables: variables.filter(v => v.isRelevant === true), // Only save checked variables
    };

    const updatedPrompts = [newPrompt, ...savedPrompts].slice(0, 10);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem("savedPrompts", JSON.stringify(updatedPrompts));

    toast({
      title: "Success",
      description: "Prompt saved successfully",
    });
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
    if (variables.length < 10) {
      const newId = `v${Date.now()}`;
      setVariables([...variables, { id: newId, name: "", value: "", isRelevant: null }]);
    } else {
      toast({
        title: "Limit reached",
        description: "You can add a maximum of 10 variables",
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

  const handleDeletePrompt = (id: string) => {
    const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== id);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem("savedPrompts", JSON.stringify(updatedPrompts));
    toast({
      title: "Success",
      description: "Prompt deleted successfully",
    });
  };

  const handleDuplicatePrompt = (prompt: SavedPrompt) => {
    const newPrompt = {
      ...prompt,
      id: Date.now().toString(),
      title: `${prompt.title} (Copy)`,
      date: new Date().toLocaleString(),
    };
    const updatedPrompts = [newPrompt, ...savedPrompts].slice(0, 10);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem("savedPrompts", JSON.stringify(updatedPrompts));
    toast({
      title: "Success",
      description: "Prompt duplicated successfully",
    });
  };

  const handleRenamePrompt = (id: string, newTitle: string) => {
    const updatedPrompts = savedPrompts.map(prompt =>
      prompt.id === id ? { ...prompt, title: newTitle } : prompt
    );
    setSavedPrompts(updatedPrompts);
    localStorage.setItem("savedPrompts", JSON.stringify(updatedPrompts));
    toast({
      title: "Success",
      description: "Prompt renamed successfully",
    });
  };
  
  const insertBulletList = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = promptText.substring(start, end);
    
    let newText;
    if (selected) {
      // Add bullet points to each line of selected text
      const lines = selected.split('\n');
      const bulletedLines = lines.map(line => line ? `• ${line}` : line);
      newText = promptText.substring(0, start) + bulletedLines.join('\n') + promptText.substring(end);
    } else {
      // Insert a single bullet point at cursor position
      newText = promptText.substring(0, start) + '• ' + promptText.substring(end);
    }
    
    setPromptText(newText);
    
    // Set cursor position after the inserted bullet
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
      // Add numbers to each line of selected text
      const lines = selected.split('\n');
      const numberedLines = lines.map((line, index) => line ? `${index + 1}. ${line}` : line);
      newText = promptText.substring(0, start) + numberedLines.join('\n') + promptText.substring(end);
    } else {
      // Insert a single numbered point at cursor position
      newText = promptText.substring(0, start) + '1. ' + promptText.substring(end);
    }
    
    setPromptText(newText);
    
    // Set cursor position after the inserted number
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + 3;
    }, 0);
    
    toast({
      title: "Added numbered list",
      description: "Numbers have been added to your text",
    });
  };

  // Handle key down events for auto-continuing lists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget;
      const { selectionStart } = textarea;
      const currentText = promptText;
      
      // Get the current line up to the cursor position
      const textBeforeCursor = currentText.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check if the current line starts with a bullet point
      if (currentLine.trimStart().startsWith('• ')) {
        e.preventDefault();
        
        // If the line is empty except for the bullet, remove it (exit the list)
        if (currentLine.trim() === '•' || currentLine.trim() === '• ') {
          const newLines = [...lines];
          newLines[newLines.length - 1] = '';
          const newText = newLines.join('\n') + currentText.substring(selectionStart);
          setPromptText(newText);
          
          // Set cursor position
          setTimeout(() => {
            textarea.focus();
            const newCursorPosition = textBeforeCursor.length - currentLine.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
          }, 0);
        } else {
          // Continue the bullet list
          const indent = currentLine.match(/^\s*/)?.[0] || '';
          const newLine = `\n${indent}• `;
          const newText = currentText.substring(0, selectionStart) + newLine + currentText.substring(selectionStart);
          setPromptText(newText);
          
          // Set cursor position after the bullet on the new line
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
          }, 0);
        }
        return;
      }
      
      // Check if the current line starts with a numbered list (e.g., "1. ")
      const numberedListMatch = currentLine.trimStart().match(/^(\d+)\.\s/);
      if (numberedListMatch) {
        e.preventDefault();
        
        // If the line is empty except for the number, remove it (exit the list)
        if (currentLine.trim() === `${numberedListMatch[1]}.` || currentLine.trim() === `${numberedListMatch[1]}. `) {
          const newLines = [...lines];
          newLines[newLines.length - 1] = '';
          const newText = newLines.join('\n') + currentText.substring(selectionStart);
          setPromptText(newText);
          
          // Set cursor position
          setTimeout(() => {
            textarea.focus();
            const newCursorPosition = textBeforeCursor.length - currentLine.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
          }, 0);
        } else {
          // Continue the numbered list with incremented number
          const currentNumber = parseInt(numberedListMatch[1], 10);
          const indent = currentLine.match(/^\s*/)?.[0] || '';
          const newLine = `\n${indent}${currentNumber + 1}. `;
          const newText = currentText.substring(0, selectionStart) + newLine + currentText.substring(selectionStart);
          setPromptText(newText);
          
          // Set cursor position after the number on the new line
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
          }, 0);
        }
      }
    }
  };

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
            <div className="mb-6">
              <p className="text-card-foreground mb-4">
                Answer the following questions to enhance your prompt, mark them as relevant or not relevant
              </p>
              
              <div className="flex">
                {/* Vertical slider */}
                <div className="relative w-10 h-[500px] mr-4">
                  <div 
                    className="absolute inset-0 rounded-full border border-gray-200 cursor-pointer bg-[#f6f6f7]"
                    onClick={handleSliderDrag}
                    onMouseDown={handleSliderMouseDown}
                  >
                    {questions.length > 0 && (
                      <div 
                        className="absolute w-full h-10 bg-gray-400 rounded-full left-0 transform -translate-y-1/2"
                        style={{ top: `${sliderThumbPosition}%` }}
                      ></div>
                    )}
                    <div className="absolute w-full top-0 flex justify-center cursor-pointer">
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-400"></div>
                    </div>
                    <div className="absolute w-full bottom-0 flex justify-center cursor-pointer">
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                    </div>
                  </div>
                </div>
                
                {/* Questions container with vertical scrolling */}
                <div 
                  ref={questionsContainerRef}
                  className="flex-1 max-h-[500px] overflow-y-auto pr-2 space-y-4 scrollbar-hide"
                  onScroll={handleContainerScroll}
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
                            className="w-full p-3 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Variables</h3>
                <button 
                  onClick={addVariable}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add variable
                </button>
              </div>
              
              <div className="space-y-3">
                {variables.map((variable, index) => (
                  <div key={variable.id} className="flex gap-3 items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Variable name"
                        value={variable.name}
                        onChange={(e) => handleVariableChange(variable.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <AlertDialog open={variableToDelete === variable.id} onOpenChange={(open) => !open && setVariableToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => confirmDeleteVariable(variable.id)}
                            className="p-2 rounded-full hover:bg-[#33fea6]/20"
                            title="Delete variable"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete variable?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this variable? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={removeVariable}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <button
                        onClick={() => handleVariableRelevance(variable.id, true)}
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                          variable.isRelevant === true ? 'bg-[#33fea6]' : ''
                        }`}
                        title="Keep variable"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => handleStepChange(3)}
                className={`aurora-button ${!canProceedToStep3 ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={!canProceedToStep3}
              >
                Continue
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="border rounded-xl p-4 bg-card min-h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <Input
                  value={masterCommand}
                  onChange={(e) => setMasterCommand(e.target.value)}
                  placeholder="Master command, use it to adapt the prompt to any other similar needs"
                  className="w-full h-8 text-sm"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="aurora-button inline-flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    <span>Adapt</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will regenerate your prompt. Any manual changes will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerate}>Yes</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                {primaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
                    <span className="text-xs">{item.label}</span>
                    <Switch
                      checked={selectedPrimary === item.id}
                      onCheckedChange={() => handlePrimaryToggle(item.id)}
                      className="scale-75"
                      variant="primary"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                {secondaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 px-2 border rounded-lg bg-background">
                    <span className="text-xs">{item.label}</span>
                    <Switch
                      checked={selectedSecondary === item.id}
                      onCheckedChange={() => handleSecondaryToggle(item.id)}
                      className="scale-75"
                      variant="secondary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              {variables.filter(v => v.isRelevant === true).map((variable) => (
                <div key={variable.id} className="px-3 py-1 bg-[#33fea6]/10 border border-[#33fea6]/20 rounded-full text-xs">
                  <span className="font-medium">{variable.name}:</span> {variable.value}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs">JSON Toggle view</span>
              <Switch
                checked={showJson}
                onCheckedChange={setShowJson}
                className="scale-75"
              />
            </div>

            <div className="relative flex-1 min-h-[50vh] mb-3">
              <textarea
                value={showJson ? JSON.stringify({ 
                  prompt: finalPrompt, 
                  masterCommand,
                  variables: variables.filter(v => v.isRelevant === true)
                }, null, 2) : finalPrompt}
                onChange={(e) => setFinalPrompt(e.target.value)}
                className="absolute inset-0 p-4 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Final Prompt"
                readOnly={showJson}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleCopyPrompt}
                className="aurora-button inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleSavePrompt}
                className="aurora-button inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex items-center justify-center">
            <div className="w-full">
              {renderContent()}
              
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => handleStepChange(1)}
                  className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                    currentStep === 1 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
                  }`}
                  aria-label="Go to step 1"
                />
                <button
                  onClick={() => handleStepChange(2)}
                  className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                    currentStep === 2 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
                  }`}
                  aria-label="Go to step 2"
                />
                <button
                  onClick={() => handleStepChange(3)}
                  className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                    currentStep === 3 ? 'bg-primary' : 'bg-border hover:bg-primary/50'
                  }`}
                  aria-label="Go to step 3"
                />
              </div>
            </div>
          </div>
        </main>

        <Sidebar side="right">
          <SidebarContent>
            <div className="p-4 flex items-center gap-3 border-b">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="font-medium">User Name</span>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search..." />
              </div>
            </div>

            <div className="overflow-auto">
              {savedPrompts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b flex items-center justify-between group/item"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <div className="p-1 hover:bg-accent rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleDuplicatePrompt(item)}>
                        <CopyIcon className="mr-2 h-4 w-4" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newTitle = window.prompt("Enter new name:", item.title);
                        if (newTitle) handleRenamePrompt(item.id, newTitle);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeletePrompt(item.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="absolute top-6 right-6 z-50">
          <SidebarTrigger className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
