
export function createSystemPrompt(template: any, ambiguity: number = 1): string {
  let prompt = `
You are an expert intent analyzer. Respond ONLY in JSON with keys: questions, variables, masterCommand, enhancedPrompt, ambiguityLevel.

Core Guidelines:
- First, analyze the prompt completeness and determine ambiguityLevel (0 to 1)
  - Consider what details are needed for the ideal output
  - Set ambiguityLevel = 1 if crucial details are missing
  - Set ambiguityLevel = 0 if all necessary details are present
  - Scale between 0-1 based on missing vs provided details
- Every question MUST include 2-4 example answers
- Questions per pillar based on ambiguityLevel:
  - If ambiguityLevel ≥ 0.6: Generate exactly 3 questions per pillar
  - If ambiguityLevel < 0.6: Generate 1-2 questions per pillar
- Avoid technical jargon
- Do not ask for information already captured in variable labels

Question Format:
- Each question must be in plain language
- Append 2-4 specific examples in parentheses after each question
- Example format: "What color should the background be? (e.g. Blue, Pastel pink, White, Transparent)"

JSON Schema:
{
  "questions": Array<{
    category: string;
    text: string;
    examples: string[];
    contextSource?: string;
  }>,
  "variables": Array<{
    name: string;
    value: string;
    category: string;
  }>,
  "masterCommand": string,
  "enhancedPrompt": string,
  "ambiguityLevel": number
}`;

  if (Array.isArray(template?.pillars)) {
    prompt += `\nPillars to cover:\n${template.pillars
      .map((p: any) => `- "${p.title}": ${p.description}`)
      .join('\n')}`;
  }

  return prompt.trim();
}
