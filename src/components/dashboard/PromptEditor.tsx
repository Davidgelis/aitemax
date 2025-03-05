import { List, ListOrdered } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PromptEditorProps {
  promptText: string;
  setPromptText: (text: string) => void;
  onAnalyze: () => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  isLoading: boolean;
}

export const PromptEditor = ({ 
  promptText, 
  setPromptText, 
  onAnalyze, 
  selectedPrimary,
  selectedSecondary,
  isLoading
}: PromptEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [submittedPrompt, setSubmittedPrompt] = useState("");

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

  const analyzeWithAI = async () => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    
    setError(null);
    setSubmittedPrompt(promptText);
    
    onAnalyze();
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

  const showPromptPopup = () => {
    if (submittedPrompt) {
      setShowPromptDialog(true);
    } else {
      toast({
        title: "No prompt submitted",
        description: "Please analyze a prompt first before viewing it",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-xl p-6 bg-card min-h-[400px] relative">
      <div className="flex space-x-2 mb-2">
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
        placeholder="Start by typing your prompt. For example: 'Create an email template for customer onboarding' or 'Write a prompt for generating code documentation'"
      />
      {error && (
        <div className="mt-2 p-2 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      <div className="absolute bottom-6 right-6">
        <button 
          onClick={analyzeWithAI}
          className="aurora-button"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Analyze with AI"}
        </button>
      </div>

      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submitted Prompt</DialogTitle>
            <DialogDescription>
              This is the prompt that was submitted for analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 mt-2 border rounded-md bg-muted/50">
            <div className="whitespace-pre-wrap text-card-foreground">
              {submittedPrompt}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
