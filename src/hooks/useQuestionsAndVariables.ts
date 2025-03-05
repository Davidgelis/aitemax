
import { Question, Variable } from "@/components/dashboard/types";
import { filterCategoryVariables } from "@/components/dashboard/constants";
import { useToast } from "@/hooks/use-toast";

export const useQuestionsAndVariables = (
  questions: Question[],
  setQuestions: (questions: Question[]) => void,
  variables: Variable[],
  setVariables: (variables: Variable[]) => void,
  variableToDelete: string | null,
  setVariableToDelete: (id: string | null) => void
) => {
  const { toast } = useToast();

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, answer, isRelevant: true } : q
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
    // Filter out category names and empty names for the count
    const validVariables = filterCategoryVariables(variables).filter(v => v.name.trim() !== '');
    
    if (validVariables.length < 12) {
      const newId = `v${Date.now()}`;
      setVariables([...variables, { id: newId, name: "", value: "", isRelevant: null, category: "Task" }]);
    } else {
      toast({
        title: "Limit reached",
        description: "You can add a maximum of 12 variables",
        variant: "destructive",
      });
    }
  };

  const removeVariable = () => {
    if (!variableToDelete) return;
    
    // Filter out category names for the count
    const validVariables = filterCategoryVariables(variables).filter(v => v.name.trim() !== '');
    
    if (validVariables.length > 1) {
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
  
  // Only check relevant variables (filtered)
  const validVariables = filterCategoryVariables(variables).filter(v => v.name.trim() !== '');
  const allVariablesAnswered = validVariables.every(v => v.isRelevant !== null);
  
  const canProceedToStep3 = allQuestionsAnswered && allVariablesAnswered;

  return {
    handleQuestionAnswer,
    handleQuestionRelevance,
    handleVariableChange,
    handleVariableRelevance,
    addVariable,
    removeVariable,
    canProceedToStep3,
    allQuestionsAnswered,
    allVariablesAnswered
  };
};
