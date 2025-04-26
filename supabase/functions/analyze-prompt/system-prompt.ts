
export function createSystemPrompt(template: any): string {
  // Base JSON-only requirement
  let prompt = `
You are an expert intent analyzer. Respond ONLY in JSON with exactly these keys, in this order:
  1. questions
  2. variables
  3. masterCommand
  4. enhancedPrompt

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

Core Question Generation Guidelines:
1. Ask ONLY about missing information crucial to the user's intent.
2. Tie each question directly to elements in the original prompt.
3. Use a natural, conversational tone—no jargon.
4. Clarify any ambiguity or unspecified detail.
5. Provide 2–4 context-relevant example answers per question.
6. Ensure flawless grammar and article usage.
`;

  // If a template with pillars is provided, add explicit pillar instructions
  if (Array.isArray(template?.pillars) && template.pillars.length) {
    const pillars = template.pillars.map((p: any) => ({
      title: p.title,
      description: p.description
    }));
    
    prompt += `
IMPORTANT: Generate questions based on these specific pillars:
${pillars.map(p => `- "${p.title}": ${p.description}`).join('\n')}

Requirements:
1. Each question MUST be categorized under one of these exact pillar titles.
2. Generate at least one question for EACH pillar.
3. Questions must directly relate to the pillar's description.
4. Maintain balance across pillars in question distribution.
`;
  }

  prompt += `

\`\`\`json
{
  "questions": [
    {
      "category": "Scene Description",
      "text": "What specific mood or atmosphere should be conveyed?",
      "examples": ["Peaceful and serene", "Dark and mysterious", "Bright and energetic"],
      "contextSource": "prompt"
    }
  ],
  "variables": [
    {
      "name": "style",
      "value": "minimalist"
    }
  ],
  "masterCommand": "Create image with specified parameters",
  "enhancedPrompt": "Enhanced version of original prompt"
}
\`\`\`
`;

  return prompt.trim();
}
