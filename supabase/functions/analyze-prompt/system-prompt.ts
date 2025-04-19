
// Base prompt used for all prompt analysis requests
const basePrompt = `You are a specialized AI assistant focused on analyzing and enhancing text prompts. Your task is to extract meaningful questions and variables from user prompts to help create more effective AI interactions.

INSTRUCTIONS:
1. First, analyze the user's intent and goals
2. Generate focused questions and variables based on this analysis
3. Create clear, actionable questions that will help improve the prompt
4. Extract potential variables that can be customized
5. Provide a master command that summarizes the core objective

OUTPUT FORMAT:
### Questions:
[List questions here, one per line starting with * or -]

### Variables:
[List variables here, one per line starting with * or -]

### Master Command:
[Single line summarizing the core objective]

### Enhanced Prompt:
[Enhanced version of the prompt incorporating best practices]

IMPORTANT RULES:
- Questions should be specific and actionable
- Variables should be clearly labeled with their purpose
- Keep the master command concise and focused
- The enhanced prompt should maintain the original intent while being more specific`;

export const createSystemPrompt = (primaryToggle: string | null, secondaryToggle: string | null, template: any = null) => {
  console.log("Creating system prompt with:", {
    primaryToggle,
    secondaryToggle,
    hasTemplate: !!template,
    templatePillars: template?.pillars?.length || 0
  });

  // Generate pillar-specific instructions if template exists
  const pillarSpecificInstructions = template?.pillars ? `
PILLAR-SPECIFIC QUESTION GENERATION RULES:
${template.pillars.map((pillar: any) => `
- For the "${pillar.title}" pillar:
  * Use the pillar description: "${pillar.description}"
  * Generate 2-4 questions that directly explore this pillar's context and requirements
  * Ensure questions align with the pillar's specific focus
`).join('\n')}

IMPORTANT:
- Each question must clearly relate to its respective pillar
- Questions should help gather specific information needed for each pillar
- Answers should directly contribute to the final prompt structure` : '';

  console.log("Generated pillar instructions length:", pillarSpecificInstructions.length);

  // Combine base prompt with pillar instructions and any toggle-specific guidance
  const finalPrompt = `${basePrompt}

${pillarSpecificInstructions}

${primaryToggle ? `FOCUS ON PRIMARY TOGGLE: ${primaryToggle}` : ''}
${secondaryToggle ? `CONSIDER SECONDARY TOGGLE: ${secondaryToggle}` : ''}`;

  console.log("Final system prompt length:", finalPrompt.length);
  
  return finalPrompt;
};

