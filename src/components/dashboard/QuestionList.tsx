import { X, FileText, Edit } from "lucide-react";
import { Question } from "./types";
import { RefObject, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { placeholderTestQuestions } from "./constants";

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt?: string;
}

export const QuestionList = ({
  questions,
  onQuestionRelevance,
  onQuestionAnswer,
  containerRef,
  originalPrompt
}: QuestionListProps) => {
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editResponseSheet, setEditResponseSheet] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const maxCharacterLimit = 1000; // Set the character limit to 1000

  console.log('Incoming questions:', questions);
  
  // Display placeholder test questions if no questions are provided
  const displayQuestions = questions.length > 0 ? questions : placeholderTestQuestions;

  // Group questions by category
  const groupedQuestions: Record<string, Question[]> = {};
  
  // Extract prominent terms from prompt to highlight related questions
  const extractKeyTerms = (prompt: string): string[] => {
    if (!prompt) return [];
    
    // Extract nouns and key objects from the prompt
    const words = prompt.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^a-z]/g, ''));
      
    // Remove common words and return unique terms
    const commonWords = ['this', 'that', 'with', 'from', 'have', 'will', 'what', 'when', 'where', 'which', 'create', 'make', 'generate'];
    return [...new Set(words.filter(w => !commonWords.includes(w)))];
  };
  
  const keyTerms = originalPrompt ? extractKeyTerms(originalPrompt) : [];
  
  // Sort categories to ensure consistent order
  displayQuestions.forEach(question => {
    const category = question.category || 'Other';
    
    if (!groupedQuestions[category]) {
      groupedQuestions[category] = [];
    }
    groupedQuestions[category].push(question);
  });

  console.log('Grouped questions:', groupedQuestions);

  // Sort categories alphabetically, but keep certain pillars first
  const pillarOrder = ['Task', 'Persona', 'Conditions', 'Instructions'];
  const categories = Object.keys(groupedQuestions).sort((a, b) => {
    const aIndex = pillarOrder.indexOf(a);
    const bIndex = pillarOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const cleanQuestionText = (text: string): string => {
    if (!text) return "";
    
    // First, remove any leading numbered pattern like "0: " or "1: " that appears in image analysis
    let cleanedText = text.replace(/^\s*\d+\s*:\s*/i, '');
    
    // Remove category prefixes with asterisks like "**Task**:" or "Task:"
    cleanedText = cleanedText.replace(/^\s*(\*\*)?(?:Task|Persona|Conditions|Instructions)(\*\*)?\s*:\s*/i, '');
    
    // Also remove any remaining asterisks
    cleanedText = cleanedText.replace(/\*\*/g, '');
    
    // Remove "questions:" prefix that might appear in image analysis
    cleanedText = cleanedText.replace(/^questions:\s*/i, '');
    
    // Remove "Based on image analysis:" prefix if present
    cleanedText = cleanedText.replace(/^based on image analysis:\s*/i, '');
    
    return cleanedText.trim();
  };

  const isHighlyRelevantToPrompt = (questionText: string): boolean => {
    if (!originalPrompt || !questionText || keyTerms.length === 0) return false;
    
    const cleanText = cleanQuestionText(questionText).toLowerCase();
    
    // Check if question contains multiple key terms from the prompt
    const termCount = keyTerms.filter(term => cleanText.includes(term)).length;
    return termCount >= 2 || 
           (keyTerms.length === 1 && cleanText.includes(keyTerms[0])) ||
           (questionText.includes('image') && originalPrompt.toLowerCase().includes('image'));
  };

  const cleanAnswerText = (answer: string): string => {
    if (!answer) return "";
    
    // Extract only the first paragraph if it contains multiple numbered questions
    if (answer.includes("\n0:") || answer.includes("\n1:")) {
      const firstParagraph = answer.split("\n")[0];
      return firstParagraph.trim();
    }
    
    // Remove any numbered question patterns
    const cleanedAnswer = answer
      // Remove any numbered patterns like "0: Something"
      .replace(/\d+\s*:\s*[^\d:]*/g, '')
      // Remove any numbered list patterns like "1. Something"
      .replace(/\d+\.\s+[^.?!]*\?/g, '')
      // Remove the "Based on image analysis: questions:" prefix if present
      .replace(/^based on image analysis:\s*questions:\s*/i, '')
      // Remove just "questions:" prefix if present
      .replace(/^questions:\s*/i, '')
      // Remove "Based on image analysis:" prefix if present
      .replace(/^based on image analysis:\s*/i, '')
      .trim();
      
    return cleanedAnswer;
  };

  // Function to open the response editing sheet
  const handleEditResponse = (question: Question) => {
    if (question.isRelevant === false) return;
    
    setEditingQuestion({...question});
    setCurrentAnswer(question.answer || '');
    setEditResponseSheet(true);
  };

  // Function to save the edited response
  const handleSaveResponse = () => {
    if (editingQuestion) {
      onQuestionAnswer(editingQuestion.id, currentAnswer);
      setEditResponseSheet(false);
      setEditingQuestion(null);
    }
  };
  
  // Modified function to toggle question relevance for ONLY the clicked question
  const handleToggleRelevance = (questionId: string, currentIsRelevant: boolean | null) => {
    // If currently irrelevant (false), make it relevant (true)
    // If currently relevant (true) or undecided (null), make it irrelevant (false)
    const newRelevance = currentIsRelevant === false ? true : false;
    
    // Only toggle the relevance of the specific question that was clicked
    onQuestionRelevance(questionId, newRelevance);
  };

  // Function to get the first 10 words of the answer
  const getAnswerPreview = (answer: string) => {
    if (!answer) return "";
    // Clean the answer first to remove any nested questions
    const cleanedAnswer = cleanAnswerText(answer);
    const words = cleanedAnswer.split(' ');
    return words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
  };

  const renderTechnicalTerms = (question: Question) => {
    if (!question.technicalTerms || question.technicalTerms.length === 0) return null;

    return (
      <div className="ml-11 mt-2 space-y-2">
        {question.technicalTerms.map((term, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-2 text-xs bg-accent/10 px-2 py-1 rounded-full cursor-help">
                  <span className="font-medium">{term.term}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                <div className="space-y-2">
                  <p className="font-medium">{term.explanation}</p>
                  <p className="text-sm text-muted-foreground">{term.example}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Questions</h3>
        {originalPrompt && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowPromptSheet(true)} 
                  className="flex items-center gap-1 text-sm hover:bg-[#33fea6]/20 p-2 rounded-full transition-colors" 
                  title="View submitted prompt"
                >
                  <FileText className="w-6 h-6 text-[#33fea6]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View the submitted prompt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2 space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-4">
            <h4 className="font-medium text-sm text-accent bg-accent/5 p-2 rounded-md">
              {category}
              <span className="text-xs text-muted-foreground ml-2">
                ({groupedQuestions[category].length})
              </span>
            </h4>
            
            {groupedQuestions[category].map((question, index) => {
              // Check if this question is highly relevant to the original prompt
              const isPromptSpecific = isHighlyRelevantToPrompt(question.text);
              
              return (
                <div key={question.id} className="p-4 border rounded-lg bg-background">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between group">
                      <div 
                        className={`flex-grow flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                                  ${question.isRelevant === false ? 'opacity-60' : ''}
                                  ${question.answer && question.isRelevant !== false ? 'bg-[#33fea6]/20' : 'hover:bg-[#33fea6]/20'}`}
                        onClick={() => handleEditResponse(question)}
                      >
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-card-foreground">{cleanQuestionText(question.text)}</span>
                          
                          {/* Show source badges */}
                          {question.contextSource === "image" && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Image
                            </span>
                          )}
                          
                          {/* Show prompt-specific badge */}
                          {isPromptSpecific && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Prompt specific
                            </span>
                          )}
                        </div>
                        
                        {question.isRelevant !== false && (
                          <Edit className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-80 text-[#33fea6]" />
                        )}
                      </div>
                      <button 
                        onClick={() => handleToggleRelevance(question.id, question.isRelevant)} 
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${question.isRelevant === false ? 'bg-[#33fea6]/20' : ''}`}
                        title={question.isRelevant === false ? "Mark as relevant" : "Mark as not relevant"}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Add technical terms display */}
                    {question.isRelevant !== false && renderTechnicalTerms(question)}
                    
                    {question.isRelevant !== false && question.answer && (
                      <div className="pl-8 pr-2 text-sm text-gray-600 line-clamp-2 italic bg-gray-50 p-2 rounded">
                        {getAnswerPreview(question.answer)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Original Prompt Sheet */}
      <Sheet open={showPromptSheet} onOpenChange={setShowPromptSheet}>
        <SheetContent className="w-[90%] sm:max-w-[600px] md:max-w-[800px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>Submitted Prompt</SheetTitle>
            <SheetDescription>
              This is the original prompt you submitted for analysis.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <div className="w-full min-h-[40vh] p-4 text-sm rounded-md border bg-gray-50/80 text-card-foreground overflow-y-auto whitespace-pre-wrap">
              {originalPrompt}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Response Editing Sheet */}
      <Sheet open={editResponseSheet} onOpenChange={(open) => {
        if (!open) {
          handleSaveResponse();
        }
        setEditResponseSheet(open);
      }}>
        <SheetContent className="w-[90%] sm:max-w-[500px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>Edit Response</SheetTitle>
            <SheetDescription>
              Provide your answer to this question
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="text-base font-medium">
              {editingQuestion?.text && cleanQuestionText(editingQuestion.text)}
            </div>
            <div className="relative">
              <textarea 
                value={currentAnswer} 
                onChange={(e) => {
                  // Limit input to maxCharacterLimit characters
                  if (e.target.value.length <= maxCharacterLimit) {
                    setCurrentAnswer(e.target.value);
                  }
                }} 
                placeholder="Type your answer here..." 
                className="w-full p-4 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground resize-none min-h-[200px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
                maxLength={maxCharacterLimit}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {currentAnswer.length}/{maxCharacterLimit}
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveResponse}
                className="aurora-button"
              >
                Save Response
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
