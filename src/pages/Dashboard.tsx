
import { Search, User, Check, X, Copy, RotateCw, Save, MoreVertical, Trash, Pencil, Copy as CopyIcon, List, ListOrdered } from "lucide-react";
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

interface SavedPrompt {
  id: string;
  title: string;
  date: string;
  promptText: string;
  masterCommand: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
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
];

const Dashboard = () => {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [masterCommand, setMasterCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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

  const allQuestionsAnswered = questions.every(q => q.isRelevant !== null);

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

    setCurrentStep(step);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(showJson ? JSON.stringify({ prompt: finalPrompt, masterCommand }, null, 2) : finalPrompt);
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
                  />
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-6 bg-card min-h-[400px] relative">
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={insertBulletList}
                  className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                  title="Add bullet list"
                >
                  <List className="w-5 h-5 text-primary" />
                </button>
                <button
                  onClick={insertNumberedList}
                  className="p-2 rounded-md hover:bg-accent/20 transition-colors"
                  title="Add numbered list"
                >
                  <ListOrdered className="w-5 h-5 text-primary" />
                </button>
              </div>
              <textarea 
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
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
            <div className="mb-4">
              <p className="text-card-foreground mb-4">
                Answers the following questions to enhance your prompt, answer the questions that add and mark them and mark the ones the valid ones or invalid ones
              </p>
              
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="p-4 border rounded-lg bg-background">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-card-foreground">{question.text}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuestionRelevance(question.id, false)}
                            className={`p-2 rounded-full hover:bg-accent ${
                              question.isRelevant === false ? 'bg-accent' : ''
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQuestionRelevance(question.id, true)}
                            className={`p-2 rounded-full hover:bg-accent ${
                              question.isRelevant === true ? 'bg-accent' : ''
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

            {allQuestionsAnswered && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="aurora-button"
                >
                  Continue
                </button>
              </div>
            )}
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
                    />
                  </div>
                ))}
              </div>
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
                value={showJson ? JSON.stringify({ prompt: finalPrompt, masterCommand }, null, 2) : finalPrompt}
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
