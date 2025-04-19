
// Base prompt used for all prompt analysis requests
const basePrompt = `You are a specialized AI assistant focused on analyzing and enhancing text prompts. Your task is to extract meaningful questions and variables from user prompts to help create more effective AI interactions.

INSTRUCTIONS:
1. First, analyze the user's intent and goals
2. Generate focused questions based on this analysis
3. Extract potential variables that can be customized
4. Create a master command that summarizes the core objective

OUTPUT FORMAT:
### Questions:
[List questions without any prefixes or markers, one per line]

### Variables:
[List variables in plain text format: Name: Description]
[Only suggest values if background information was provided]

### Master Command:
[Single line summarizing the core objective]

### Enhanced Prompt:
[Enhanced version of the prompt incorporating best practices]

IMPORTANT RULES:
- Questions should be clear and direct, without any prefixes or markers
- Variables should be in plain text without code formatting
- Only pre-fill variable values when background info is provided
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
PILLAR-SPECIFIC INSTRUCTIONS:
${template.pillars.map((pillar: any) => `
For "${pillar.title}" pillar (${pillar.description}):
- Generate 2-3 specific questions exploring this pillar's context
- Create 1-2 variables that capture key ${pillar.title} requirements
- Ensure all questions and variables directly relate to ${pillar.title}

Required format for this pillar:
Questions for ${pillar.title}:
[Question specific to ${pillar.title}]
[Question specific to ${pillar.title}]

Variables for ${pillar.title}:
[Variable name]: [Description]
`).join('\n')}

NOTE:
- Each question and variable must be clearly associated with its pillar
- Variables should be in plain text format
- Questions should help gather specific requirements for each pillar
` : '';

  // Combine base prompt with pillar instructions
  const finalPrompt = `${basePrompt}

${pillarSpecificInstructions}

${primaryToggle ? `PRIMARY FOCUS: ${primaryToggle}` : ''}
${secondaryToggle ? `SECONDARY FOCUS: ${secondaryToggle}` : ''}`;

  console.log("Final system prompt length:", finalPrompt.length);
  console.log("Pillar-specific instructions:", !!pillarSpecificInstructions);
  
  return finalPrompt;
};
