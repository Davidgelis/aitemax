
import { Edit, PlusCircle, Check, X } from "lucide-react";
import { Variable, PromptJsonStructure } from "../types";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

interface FinalPromptDisplayProps {
  finalPrompt: string;
  getProcessedPrompt: () => string;
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  showJson: boolean;
  masterCommand: string;
  handleOpenEditPrompt: () => void;
}

export const FinalPromptDisplay = ({
  finalPrompt,
  getProcessedPrompt,
  variables,
  setVariables,
  showJson,
  masterCommand,
  handleOpenEditPrompt
}: FinalPromptDisplayProps) => {
  const [processedPrompt, setProcessedPrompt] = useState("");
  const [promptJson, setPromptJson] = useState<PromptJsonStructure | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [jsonGenerated, setJsonGenerated] = useState(false);
  const [isCreatingVariable, setIsCreatingVariable] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const promptContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Force re-render key
  
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    getUserId();
  }, []);
  
  const relevantVariables = Array.isArray(variables) 
    ? variables.filter(v => v && typeof v === 'object' && v?.isRelevant === true) 
    : [];
  
  const convertPromptToJson = useCallback(async () => {
    if (!finalPrompt || finalPrompt.trim() === "" || jsonGenerated) return;
    
    setIsLoadingJson(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-to-json', {
        body: {
          prompt: finalPrompt,
          masterCommand,
          userId,
          promptId
        }
      });
      
      if (error) {
        throw new Error(`Error calling prompt-to-json: ${error.message}`);
      }
      
      if (data && data.jsonStructure) {
        setPromptJson(data.jsonStructure);
        setJsonGenerated(true);
        console.log("Prompt JSON structure generated:", data.jsonStructure);
      }
    } catch (error) {
      console.error("Error converting prompt to JSON:", error);
      toast({
        title: "Error generating JSON",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingJson(false);
    }
  }, [finalPrompt, masterCommand, toast, userId, promptId, jsonGenerated]);
  
  useEffect(() => {
    if (showJson && !jsonGenerated && !isLoadingJson) {
      convertPromptToJson();
    }
  }, [showJson, finalPrompt, convertPromptToJson, jsonGenerated, isLoadingJson]);
  
  // Update processed prompt whenever variables change
  useEffect(() => {
    try {
      if (typeof getProcessedPrompt === 'function') {
        const result = getProcessedPrompt();
        setProcessedPrompt(result || "");
      }
    } catch (error) {
      console.error("Error processing prompt:", error);
      setProcessedPrompt(finalPrompt || "");
    }
  }, [getProcessedPrompt, finalPrompt, variables, renderKey]);
  
  // Handle user text selection
  const handleMouseUp = () => {
    if (!isCreatingVariable) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;
    
    const range = selection.getRangeAt(0);
    const container = promptContainerRef.current;
    
    if (!container || !container.contains(range.commonAncestorContainer)) return;
    
    // Get the selected text
    const selectedText = selection.toString().trim();
    setSelectedText(selectedText);
    
    // Create a span to mark the position
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('id', 'temp-selection-marker');
    tempSpan.style.display = 'inline';
    
    try {
      range.surroundContents(tempSpan);
      
      // Position the confirmation dialog near the selection
      const tempElement = document.getElementById('temp-selection-marker');
      if (tempElement) {
        const rect = tempElement.getBoundingClientRect();
        
        // Set temporary styles to position the confirmation buttons
        setSelectionRange({
          start: rect.left,
          end: rect.top
        });
      }
    } catch (e) {
      console.error("Error highlighting selection:", e);
      toast({
        title: "Selection error",
        description: "Could not select text. Try selecting a simpler text segment.",
        variant: "destructive"
      });
      cancelVariableCreation();
      return;
    }
  };
  
  // Create a new variable from the selected text
  const createVariableFromSelection = () => {
    if (!selectedText) return;
    
    if (relevantVariables.length >= 15) {
      toast({
        title: "Variable limit reached",
        description: "You can create up to 15 variables",
        variant: "destructive"
      });
      cancelVariableCreation();
      return;
    }
    
    // Remove temporary marker and replace with variable
    const tempElement = document.getElementById('temp-selection-marker');
    if (!tempElement) {
      cancelVariableCreation();
      return;
    }
    
    const variableName = selectedText.length > 15 
      ? `${selectedText.substring(0, 15)}...` 
      : selectedText;
    
    const newVariable: Variable = {
      id: uuidv4(),
      name: variableName,
      value: selectedText,
      isRelevant: true,
      category: 'User-Defined'
    };
    
    setVariables(prevVariables => [...prevVariables, newVariable]);
    
    toast({
      title: "Variable created",
      description: `Created variable: ${variableName}`,
    });
    
    cancelVariableCreation();
    setRenderKey(prev => prev + 1); // Force re-render
  };
  
  // Cancel variable creation mode
  const cancelVariableCreation = () => {
    setIsCreatingVariable(false);
    setSelectedText("");
    setSelectionRange(null);
    
    // Remove temporary marker if it exists
    const tempElement = document.getElementById('temp-selection-marker');
    if (tempElement) {
      // Replace the span with its text content
      tempElement.outerHTML = tempElement.textContent || "";
    }
    
    window.getSelection()?.removeAllRanges();
  };
  
  // Toggle variable creation mode
  const toggleVariableCreation = () => {
    if (isCreatingVariable) {
      cancelVariableCreation();
    } else {
      setIsCreatingVariable(true);
      toast({
        title: "Variable creation mode",
        description: "Select text to create a variable",
      });
    }
  };
  
  // Handle variable removal
  const removeVariable = (variableId: string) => {
    setVariables(prevVariables => 
      prevVariables.map(v => 
        v.id === variableId ? { ...v, isRelevant: false } : v
      )
    );
    
    toast({
      title: "Variable removed",
      description: "Variable has been removed",
    });
    
    setRenderKey(prev => prev + 1); // Force re-render
  };
  
  // Update variable value - direct replacement
  const updateVariableValue = (variableId: string, newValue: string) => {
    // Find the variable
    const variable = relevantVariables.find(v => v.id === variableId);
    if (!variable) return;
    
    // Update variable in state with new value
    setVariables(prevVariables => 
      prevVariables.map(v => 
        v.id === variableId ? { ...v, value: newValue } : v
      )
    );
    
    // Force re-render to update display
    setRenderKey(prev => prev + 1);
  };
  
  const renderProcessedPrompt = () => {
    if (showJson) {
      try {
        if (isLoadingJson) {
          return <div className="text-xs animate-pulse">Generating JSON structure...</div>;
        }
        
        if (promptJson) {
          return (
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(promptJson, null, 2)}
            </pre>
          );
        }
        
        return (
          <pre className="text-xs font-mono">
            {JSON.stringify({ 
              prompt: finalPrompt || "", 
              masterCommand: masterCommand || ""
            }, null, 2)}
          </pre>
        );
      } catch (error) {
        console.error("Error rendering JSON:", error);
        return <pre className="text-xs font-mono">Error rendering JSON</pre>;
      }
    }

    try {
      if (!processedPrompt) {
        return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
      }
      
      // Create a structure to represent the prompt with variables replaced by input fields
      const paragraphs = processedPrompt.split('\n\n');
      
      return (
        <div 
          className="prose prose-sm max-w-none" 
          ref={promptContainerRef}
          onMouseUp={handleMouseUp}
        >
          {isCreatingVariable && selectionRange && selectedText ? (
            <div 
              className="fixed z-20 bg-white shadow-lg rounded-lg p-2 flex gap-2"
              style={{
                left: `${typeof selectionRange.start === 'number' ? selectionRange.start : 0}px`,
                top: `${typeof selectionRange.end === 'number' ? selectionRange.end + 20 : 0}px`,
              }}
            >
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0" 
                onClick={createVariableFromSelection}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0" 
                onClick={cancelVariableCreation}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          
          {paragraphs.map((paragraph, index) => {
            if (!paragraph) return null;
            
            let displayParagraph = paragraph;
            const segmentMap = new Map<number, { 
              id: string, 
              value: string, 
              start: number, 
              end: number 
            }>();
            
            // Find all variable positions in the paragraph
            relevantVariables.forEach(variable => {
              if (!variable.value) return;
              
              // Find all occurrences of this variable in the paragraph
              let position = displayParagraph.indexOf(variable.value);
              while (position !== -1) {
                segmentMap.set(position, {
                  id: variable.id,
                  value: variable.value,
                  start: position,
                  end: position + variable.value.length
                });
                position = displayParagraph.indexOf(variable.value, position + 1);
              }
            });
            
            // Sort segments by their start position (to process from end to beginning)
            const sortedSegments = Array.from(segmentMap.values())
              .sort((a, b) => b.start - a.start);
            
            // Create array of chunks alternating between text and inputs
            const chunks: JSX.Element[] = [];
            let lastEnd = displayParagraph.length;
            
            for (const segment of sortedSegments) {
              // Add text after variable
              if (segment.end < lastEnd) {
                chunks.unshift(
                  <span key={`text-${segment.end}`}>
                    {displayParagraph.substring(segment.end, lastEnd)}
                  </span>
                );
              }
              
              // Add variable input
              const variable = relevantVariables.find(v => v.id === segment.id);
              if (variable) {
                chunks.unshift(
                  <span key={`var-${segment.id}-${segment.start}`} className="inline-block relative">
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) => updateVariableValue(variable.id, e.target.value)}
                      className="variable-input px-1 py-0 m-0 border-b border-[#33fea6] bg-[#33fea6]/10 font-medium min-w-16 inline-block"
                    />
                    <button 
                      className="absolute -top-3 -right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity variable-delete-btn"
                      onClick={() => removeVariable(variable.id)}
                    >
                      <X className="w-3 h-3 text-gray-600" />
                    </button>
                  </span>
                );
              }
              
              // Add text before variable
              if (segment.start > 0) {
                chunks.unshift(
                  <span key={`text-${segment.start}`}>
                    {displayParagraph.substring(0, segment.start)}
                  </span>
                );
                
                // Update displayParagraph to not include processed parts
                displayParagraph = displayParagraph.substring(0, segment.start);
              }
              
              lastEnd = segment.start;
            }
            
            // Add any remaining text at the beginning
            if (lastEnd > 0) {
              chunks.unshift(
                <span key={`text-start`}>
                  {displayParagraph.substring(0, lastEnd)}
                </span>
              );
            }
            
            return (
              <p key={index} className="relative">
                {chunks.length > 0 ? chunks : displayParagraph}
              </p>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error rendering processed prompt:", error);
      return <div className="prose prose-sm max-w-none">{finalPrompt || ""}</div>;
    }
  };

  return (
    <div className="relative flex-1 mb-4 overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        <button 
          onClick={toggleVariableCreation}
          className={`p-2 rounded-full ${isCreatingVariable ? 'bg-accent text-white' : 'bg-white/80 hover:bg-white'} transition-colors`}
          aria-label={isCreatingVariable ? "Cancel creating variable" : "Create variable"}
        >
          <PlusCircle className={`w-4 h-4 ${isCreatingVariable ? 'text-white' : 'text-accent'}`} />
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            try {
              if (typeof handleOpenEditPrompt === 'function') {
                handleOpenEditPrompt();
              }
            } catch (error) {
              console.error("Error opening edit prompt:", error);
            }
          }}
          className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label="Edit prompt"
        >
          <Edit className="w-4 h-4 text-accent" />
        </button>
      </div>
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-accent via-primary-dark to-primary animate-aurora opacity-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      
      <div className="relative h-full p-6 overflow-y-auto">
        <h3 className="text-lg text-accent font-medium mb-2">Final Prompt</h3>
        <div className="whitespace-pre-wrap text-card-foreground">
          {renderProcessedPrompt()}
        </div>
      </div>
      
      <style>
        {`
        .variable-input {
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }
        .variable-input:focus {
          border-color: #33fea6;
          background-color: rgba(51, 254, 166, 0.2);
        }
        .variable-delete-btn {
          transition: opacity 0.2s;
        }
        p:hover .variable-delete-btn {
          opacity: 1;
        }
        .animate-aurora {
          animation: aurora 15s ease infinite;
        }
        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        `}
      </style>
    </div>
  );
};
