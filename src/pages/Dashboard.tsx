import { Search, User, Check, X, Copy, RotateCw } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
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

interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
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

const historyItems = Array.from({ length: 10 }, (_, i) => ({
  title: "Title and Date",
  id: `history-${i}`,
}));

const mockQuestions: Question[] = [
  { id: "q1", text: "What specific aspects of complex reasoning are you interested in?", isRelevant: null, answer: "" },
  { id: "q2", text: "How would you like the output to be structured?", isRelevant: null, answer: "" },
  { id: "q3", text: "What is the target audience for this content?", isRelevant: null, answer: "" },
];

const loadingMessages = [
  "Pinpointing missing or unclear details",
  "Understanding contextual roles",
  "Identifying guidelines gaps, proper sequencing, and logical flows",
  "Generating next steps"
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
  const { toast } = useToast();

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
              <textarea 
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-[300px] bg-transparent resize-none outline-none text-card-foreground placeholder:text-muted-foreground"
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Dynamic dashboard user step 2</h2>
              <div className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-full">
                Ready
              </div>
            </div>
            
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
          <div className="border rounded-xl p-6 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Dynamic dashboard user step 3</h2>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-full hover:opacity-90 transition-opacity flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Regenerate
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

            <div className="mb-6">
              <Input
                value={masterCommand}
                onChange={(e) => setMasterCommand(e.target.value)}
                placeholder="Master command, use it to adapt the prompt to any other similar needs"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                {primaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <span className="text-sm">{item.label}</span>
                    <Switch
                      checked={selectedPrimary === item.id}
                      onCheckedChange={() => handlePrimaryToggle(item.id)}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {secondaryToggles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <span className="text-sm">{item.label}</span>
                    <Switch
                      checked={selectedSecondary === item.id}
                      onCheckedChange={() => handleSecondaryToggle(item.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">JSON Toggle view</span>
                <Switch
                  checked={showJson}
                  onCheckedChange={setShowJson}
                />
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>

            <div className="relative">
              <textarea
                value={showJson ? JSON.stringify({ prompt: finalPrompt, masterCommand }, null, 2) : finalPrompt}
                onChange={(e) => setFinalPrompt(e.target.value)}
                className="w-full min-h-[300px] p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Final Prompt"
                readOnly={showJson}
              />
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
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b hover:bg-accent cursor-pointer transition-colors flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-sm">{item.title}</span>
                </div>
              ))}
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="absolute top-6 right-6">
          <SidebarTrigger />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
