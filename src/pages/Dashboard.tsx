
import { Search, Plus, Save, FileText, MoreVertical, Copy as CopyIcon, Pencil, Trash, RotateCw, List, ListOrdered } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
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
  const [masterCommand, setMasterCommand] = useState("");
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [variables, setVariables] = useState<Variable[]>(defaultVariables);
  const [showJson, setShowJson] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState(sampleFinalPrompt);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [user, setUser] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handlePrimaryToggle = (id: string) => {
    setSelectedPrimary(currentSelected => currentSelected === id ? null : id);
  };

  const handleSecondaryToggle = (id: string) => {
    setSelectedSecondary(currentSelected => currentSelected === id ? null : id);
  };

  const handleNewPrompt = () => {
    setPromptText("");
    setQuestions([]);
    setVariables(defaultVariables.map(v => ({ ...v, value: "", isRelevant: null })));
    setFinalPrompt("");
    setMasterCommand("");
    setSelectedPrimary(null);
    setSelectedSecondary(null);
    
    toast({
      title: "New Prompt",
      description: "Started a new prompt creation process",
    });
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

  const handleAdapt = () => {
    toast({
      title: "Success",
      description: "Prompt adapted successfully",
    });
  };

  const filteredPrompts = savedPrompts.filter(prompt => 
    searchTerm === "" || 
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Master Command Input */}
          <div className="mb-6">
            <Input
              placeholder="Master command, use it to adapt the prompt to any other similar needs"
              value={masterCommand}
              onChange={(e) => setMasterCommand(e.target.value)}
              className="h-12 border border-gray-300 rounded-md"
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleAdapt} 
                className="aurora-button bg-[#33fea6] text-[#545454] hover:bg-[#33fea6]/90 flex items-center gap-2"
              >
                Adapt
              </Button>
            </div>
          </div>

          {/* Toggle Groups */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              {primaryToggles.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                  <span className="text-sm text-[#545454]">{item.label}</span>
                  <Switch 
                    checked={selectedPrimary === item.id}
                    onCheckedChange={() => handlePrimaryToggle(item.id)}
                    className="data-[state=checked]:bg-[#33fea6]"
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              {secondaryToggles.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                  <span className="text-sm text-[#545454]">{item.label}</span>
                  <Switch 
                    checked={selectedSecondary === item.id}
                    onCheckedChange={() => handleSecondaryToggle(item.id)}
                    className="data-[state=checked]:bg-[#084b49]"
                  />
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                <span className="text-sm text-[#545454]">JSON Toggle view</span>
                <Switch 
                  checked={showJson}
                  onCheckedChange={setShowJson}
                  className="data-[state=checked]:bg-[#084b49]"
                />
              </div>
            </div>
          </div>

          {/* Final Prompt Section */}
          <div className="border border-gray-200 rounded-lg bg-[#f1f8f5] p-6 mb-6 relative">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-[#545454]">Final Prompt</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  // Handle edit prompt
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            
            <div 
              className="text-[#545454] whitespace-pre-wrap prose max-w-none"
              dangerouslySetInnerHTML={{ __html: getProcessedPrompt() }}
            />
          </div>

          {/* Variables Section */}
          <div className="border border-gray-200 rounded-lg bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#545454] mb-4">Variables</h2>
            
            <div className="grid grid-cols-3 gap-4">
              {variables.filter(v => v.isRelevant).map((variable) => (
                <div key={variable.id} className="space-y-1">
                  <label className="block text-sm text-[#545454]">{variable.name}:</label>
                  <Input
                    value={variable.value}
                    onChange={(e) => {
                      setVariables(variables.map(v => 
                        v.id === variable.id ? { ...v, value: e.target.value } : v
                      ));
                    }}
                    className="h-10 bg-[#f1f8f5] border border-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              onClick={handleCopyPrompt}
              className="aurora-button flex items-center gap-2"
            >
              <CopyIcon className="h-4 w-4" />
              Copy
            </Button>
            
            <Button 
              onClick={handleSavePrompt}
              className="aurora-button flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img src="/public/lovable-uploads/ee99c740-dac6-4241-afe9-ddf5e9358b50.png" alt="User" className="h-8 w-8 rounded-full" />
            <span className="ml-2 text-[#545454]">Guest</span>
          </div>
        </div>

        <Button 
          onClick={handleNewPrompt}
          className="bg-[#33fea6] text-[#545454] hover:bg-[#33fea6]/90 w-full mb-4 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Prompt
        </Button>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {!user ? (
          <div className="text-center p-4 border border-gray-200 rounded-lg mb-4">
            <p className="text-sm text-[#545454] mb-2">
              Please sign in to save and view your prompts
            </p>
            <Button className="bg-[#084b49] text-white hover:bg-[#084b49]/90">
              Sign in
            </Button>
          </div>
        ) : isLoadingPrompts ? (
          <div className="flex justify-center items-center p-6">
            <RotateCw className="h-6 w-6 text-[#33fea6] animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-2">
            {filteredPrompts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 p-4">No saved prompts found</p>
            ) : (
              filteredPrompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 truncate">
                      <h3 className="text-sm font-medium text-[#545454] truncate">{prompt.title}</h3>
                      <p className="text-xs text-gray-500">{prompt.date}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicatePrompt(prompt)}>
                          <CopyIcon className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeletePrompt(prompt.id)} className="text-red-500">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
