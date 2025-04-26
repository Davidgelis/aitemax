
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
  const wordCount = prompt.trim().split(/\s+/).length;
  return Math.max(0, 1 - Math.min(wordCount / 20, 1));
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
  const byCat = questions.reduce((acc, q) => {
    acc[q.category || 'Other'] = acc[q.category || 'Other'] || [];
    acc[q.category || 'Other'].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  if (ambiguity > 0.5) {
    return Object.values(byCat).flatMap(categoryQuestions => {
      if (categoryQuestions.length > 3) return categoryQuestions.slice(0, 3);
      if (categoryQuestions.length < 3) {
        const extras = Array(3 - categoryQuestions.length)
          .fill(null)
          .map((_, i) => ({
            ...categoryQuestions[0],
            id: `${categoryQuestions[0].id}-dup${i}`,
            text: appendExamples(
              sanitizeQuestionText(categoryQuestions[0].text),
              categoryQuestions[0].examples
            )
          }));
        return [...categoryQuestions, ...extras];
      }
      return categoryQuestions;
    });
  }
  
  return questions;
}
