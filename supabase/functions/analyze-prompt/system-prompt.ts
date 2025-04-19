
export const createSystemPrompt = (primaryToggle: string | null, secondaryToggle: string | null, template: any = null) => {
  // Modify the existing system prompt to emphasize pillar-based question generation
  const pillarSpecificInstructions = template?.pillars ? `
PILLAR-SPECIFIC QUESTION GENERATION RULES:
${template.pillars.map((pillar: any) => `
- For the "${pillar.title}" pillar:
  * Use the pillar description: "${pillar.description}"
  * Generate 2-4 questions that directly explore this pillar's context and requirements
`).join('\n')}
` : '';

  // Append these instructions to the existing base prompt
  return basePrompt + pillarSpecificInstructions;
};
