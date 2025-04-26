
export function createSystemPrompt(template: any, ambiguity: number = 1): string {
  let prompt = `
You are an expert intent analyzer. Respond ONLY in JSON with keys: questions, variables, masterCommand, enhancedPrompt.

Core Guidelines:
- Use plain, non-technical language.
- Append 1–4 specific example answers in parentheses after each question.
- Generate 1-3 questions per pillar based on the ambiguity level and information needs.
- For ambiguous prompts with little detail, generate more questions (2-3 per pillar).
- For clear, detailed prompts, generate fewer questions (1-2 per pillar).
- Maintain friendly, conversational tone.
- Avoid technical jargon.
- Each question must include 2-4 example answers.

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
  }>,
  "masterCommand": string,
  "enhancedPrompt": string
}
`;

  if (Array.isArray(template?.pillars)) {
    prompt += `\nPillars to cover:\n${template.pillars
      .map((p: any) => `- "${p.title}": ${p.description}`)
      .join('\n')}`;
  }

  return prompt.trim();
}
