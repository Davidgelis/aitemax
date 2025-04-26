import { Question } from "@/components/dashboard/types";

export const friendlyMap: Record<string,string> = {
  "resolution": "size",
  "RGB": "color model",
  "HTTP": "web address",
  "API": "connection",
  "backend": "server",
  "frontend": "user interface",
  "database": "storage",
  "authentication": "login system",
  "deployment": "publishing",
  "debugging": "error fixing"
};

export function computeAmbiguity(prompt: string): number {
  // Enhanced ambiguity calculation
  const wordCount = prompt.trim().split(/\s+/).length;
  const baseAmbiguity = Math.max(0, 1 - Math.min(wordCount / 20, 1));
  
  // Additional factors that might indicate ambiguity
  const hasSpecificDetails = /(\d+|specific|exact|precise)/i.test(prompt);
  const hasClearObjective = /(need|want|create|make|build|design)/i.test(prompt);
  
  // Adjust ambiguity based on additional factors
  let adjustedAmbiguity = baseAmbiguity;
  if (hasSpecificDetails) adjustedAmbiguity *= 0.8; // Reduce ambiguity if specific details present
  if (!hasClearObjective) adjustedAmbiguity *= 1.2; // Increase ambiguity if no clear objective
  
  // Ensure ambiguity stays between 0 and 1
  return Math.max(0, Math.min(adjustedAmbiguity, 1));
}

export function sanitizeQuestionText(text: string): string {
  let sanitized = text;
  Object.entries(friendlyMap).forEach(([tech, friendly]) => {
    sanitized = sanitized.replace(new RegExp(`\\b${tech}\\b`, 'gi'), friendly);
  });
  return sanitized;
}

export function appendExamples(text: string, examples?: string[]): string {
  if (!examples?.length || text.includes('(')) return text;
  const ex = examples.slice(0, 4).join(', ');
  return `${text} (e.g., ${ex})`;
}

export function organizeQuestionsByPillar(questions: Question[], ambiguity: number): Question[] {
  // Group questions by category
  const byCat = questions.reduce((acc, q) => {
    acc[q.category || 'Other'] = acc[q.category || 'Other'] || [];
    acc[q.category || 'Other'].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  // Apply dynamic organization based on ambiguity
  const organized: Question[] = [];
  
  // Process each category
  Object.entries(byCat).forEach(([category, categoryQuestions]) => {
    // Calculate optimal number of questions based on ambiguity
    // More ambiguous prompts might need more questions
    let optimalCount: number;
    
    if (ambiguity > 0.7) {
      // Highly ambiguous - need more questions
      optimalCount = 3;
    } else if (ambiguity > 0.4) {
      // Moderately ambiguous
      optimalCount = 2; 
    } else {
      // Clear prompt - fewer questions needed
      optimalCount = 1;
    }
    
    // Handle category questions based on optimal count
    if (categoryQuestions.length > optimalCount) {
      // Too many questions, keep only the optimal number
      organized.push(...categoryQuestions.slice(0, optimalCount));
    } else if (categoryQuestions.length < optimalCount && ambiguity > 0.7) {
      // For highly ambiguous prompts only, create additional questions if needed
      // Don't add questions for clear prompts (respect the LLM's decision)
      const extras = Array(optimalCount - categoryQuestions.length)
        .fill(null)
        .map((_, i) => ({
          ...categoryQuestions[0],
          id: `${categoryQuestions[0].id}-dup${i}`,
          text: appendExamples(
            sanitizeQuestionText(categoryQuestions[0].text),
            categoryQuestions[0].examples
          )
        }));
      organized.push(...categoryQuestions, ...extras);
    } else {
      // Just right or we don't need to add questions for clearer prompts
      organized.push(...categoryQuestions);
    }
  });
  
  return organized;
}
