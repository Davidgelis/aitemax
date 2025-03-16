
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
  const [renderTrigger, setRenderTrigger] = useState(0);
  
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
    if (!selectedText) return;
    
    setSelectedText(selectedText);
    
    // Create a span to mark the position
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('id', 'temp-selection-marker');
    tempSpan.style.display = 'inline';
    
    try {
      // Clear any existing markers first
      const existingMarker = document.getElementById('temp-selection-marker');
      if (existingMarker) {
        existingMarker.outerHTML = existingMarker.textContent || "";
      }
      
      range.surroundContents(tempSpan);
      
      // Position the confirmation dialog near the selection
      const tempElement = document.getElementById('temp-selection-marker');
      if (tempElement) {
        const rect = tempElement.getBoundingClientRect();
        
        // Set position for the confirmation buttons
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
  
  // Create a new variable from the selected text and replace it completely in the prompt
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
    
    // Use a simple numeric name based on the number of existing variables
    const variableName = `${relevantVariables.length + 1}`;
    
    const variableId = uuidv4();
    
    const newVariable: Variable = {
      id: variableId,
      name: variableName,
      // Initialize with an empty string instead of the selected text
      value: "",
      isRelevant: true,
      category: 'User-Defined'
    };
    
    // Add the new variable to the variables array
    setVariables(prevVariables => {
      return [...prevVariables, newVariable];
    });
    
    // Replace the selection with an empty variable placeholder
    tempElement.outerHTML = `<span id="${variableId}-placeholder" class="variable-placeholder" data-variable-id="${variableId}"></span>`;
    
    toast({
      title: "Variable created",
      description: `Created variable: ${variableName}`,
    });
    
    cancelVariableCreation();
    setRenderTrigger(prev => prev + 1); // Force re-render
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
    
    setRenderTrigger(prev => prev + 1); // Force re-render
  };
  
  // Update variable value - direct replacement
  const updateVariableValue = (variableId: string, newValue: string) => {
    // Find the variable
    const variable = relevantVariables.find(v => v.id === variableId);
    if (!variable) return;
    
    console.log(`Updating variable ${variableId} with new value: "${newValue}"`);
    
    // Update variable in state with new value
    setVariables(prevVariables => 
      prevVariables.map(v => 
        v.id === variableId ? { ...v, value: newValue } : v
      )
    );
    
    // Force re-render to update display
    setRenderTrigger(prev => prev + 1);
  };
  
  // Replace a variable occurrence with an input field
  const renderVariableInput = (variable: Variable, uniqueKey: string) => {
    return (
      <span key={uniqueKey} className="inline-block relative variable-input-container">
        <input
          type="text"
          value={variable.value || ""}
          onChange={(e) => updateVariableValue(variable.id, e.target.value)}
          className="variable-input px-1 py-0 m-0 border-b border-[#33fea6] bg-[#33fea6]/10 font-medium min-w-16 inline-block"
          data-variable-id={variable.id}
          placeholder="Type here..."
        />
        <button 
          className="absolute -top-3 -right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity variable-delete-btn"
          onClick={() => removeVariable(variable.id)}
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      </span>
    );
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
          key={`prompt-content-${renderKey}`}
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
          
          {paragraphs.map((paragraph, pIndex) => {
            if (!paragraph) return null;
            
            // Process each paragraph separately
            let remainingText = paragraph;
            const elements: JSX.Element[] = [];
            let elementIndex = 0;
            
            // Look for each variable in the paragraph and replace with input field
            relevantVariables.forEach(variable => {
              // Skip variables with invalid data
              if (!variable.id) return;
              
              // Find all occurrences of the variable placeholder in the paragraph
              let position = -1;
              
              // First look for placeholder element with data-variable-id
              const placeholderRegex = new RegExp(`<span[^>]*data-variable-id="${variable.id}"[^>]*>.*?</span>`, 'g');
              const placeholderMatch = remainingText.match(placeholderRegex);
              
              if (placeholderMatch) {
                position = remainingText.indexOf(placeholderMatch[0]);
              } else if (variable.value) {
                position = remainingText.indexOf(variable.value);
              }
              
              while (position !== -1) {
                // Add text before variable
                if (position > 0) {
                  elements.push(
                    <span key={`text-${pIndex}-${elementIndex++}`}>
                      {remainingText.substring(0, position)}
                    </span>
                  );
                }
                
                // Add variable input
                elements.push(
                  renderVariableInput(variable, `var-${variable.id}-${pIndex}-${elementIndex++}`)
                );
                
                // Update remaining text
                if (placeholderMatch) {
                  remainingText = remainingText.substring(position + placeholderMatch[0].length);
                  placeholderMatch.shift(); // Remove processed match
                } else if (variable.value) {
                  remainingText = remainingText.substring(position + variable.value.length);
                  position = remainingText.indexOf(variable.value);
                } else {
                  // Break to avoid infinite loop
                  position = -1;
                }
              }
            });
            
            // Add any remaining text
            if (remainingText) {
              elements.push(
                <span key={`text-${pIndex}-${elementIndex++}`}>
                  {remainingText}
                </span>
              );
            }
            
            return (
              <p key={`paragraph-${pIndex}`} className="relative">
                {elements.length > 0 ? elements : paragraph}
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
          min-width: 4rem;
        }
        .variable-input:focus {
          border-color: #33fea6;
          background-color: rgba(51, 254, 166, 0.2);
        }
        .variable-input::placeholder {
          opacity: 0.5;
          font-style: italic;
        }
        .variable-delete-btn {
          transition: opacity 0.2s;
        }
        .variable-input-container:hover .variable-delete-btn {
          opacity: 1;
        }
        .variable-placeholder {
          background-color: rgba(51, 254, 166, 0.1);
          border-bottom: 1px dashed #33fea6;
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
