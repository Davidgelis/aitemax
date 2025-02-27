
import { Search, User, Check, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
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

// Mock questions - in real implementation, these would come from GPT-4
const mockQuestions: Question[] = [
  { id: "q1", text: "What specific aspects of complex reasoning are you interested in?", isRelevant: null },
  { id: "q2", text: "How would you like the output to be structured?", isRelevant: null },
  { id: "q3", text: "What is the target audience for this content?", isRelevant: null },
];

const Dashboard = () => {
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

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
    setQuestions(mockQuestions);
    setCurrentStep(2);
  };

  const handleQuestionRelevance = (questionId: string, isRelevant: boolean) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, isRelevant } : q
    ));
  };

  const allQuestionsAnswered = questions.every(q => q.isRelevant !== null);

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Primary Toggles Grid */}
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

            {/* Secondary Toggles Grid */}
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

            {/* Main Content Area */}
            <div className="border rounded-xl p-6 bg-card min-h-[400px] relative">
              <textarea 
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-[300px] bg-transparent resize-none outline-none text-card-foreground placeholder:text-muted-foreground"
                placeholder="Start by typing your prompt"
              />
              <button 
                onClick={handleAnalyze}
                className="absolute bottom-6 right-6 bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Analyze
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <div className="border rounded-xl p-6 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-red-500">Dynamic dashboard user step 2</h2>
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
                  </div>
                ))}
              </div>
            </div>

            {allQuestionsAnswered && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            )}
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
              
              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-4">
                <div className={`w-2 h-2 rounded-full ${currentStep === 1 ? 'bg-primary' : 'bg-border'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 2 ? 'bg-primary' : 'bg-border'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 3 ? 'bg-primary' : 'bg-border'}`} />
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <Sidebar side="right">
          <SidebarContent>
            {/* User Section */}
            <div className="p-4 flex items-center gap-3 border-b">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="font-medium">User Name</span>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search..." />
              </div>
            </div>

            {/* History List */}
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

        {/* Sidebar Trigger */}
        <div className="absolute top-6 right-6">
          <SidebarTrigger />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
