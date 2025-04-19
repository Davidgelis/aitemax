
// Base prompt used for all prompt analysis requests
const basePrompt = `You are a specialized AI assistant focused on analyzing and enhancing text prompts. Your task is to extract meaningful questions and variables from user prompts to help create more effective AI interactions.

INSTRUCTIONS:
1. First, analyze the user's intent and goals
2. Generate focused questions based on this analysis
3. Extract potential variables that can be customized
4. Create a master command that summarizes the core objective

OUTPUT FORMAT:
### Questions:
[Questions organized by pillar sections]

### Variables:
[List variables in plain text format: Name: Description]
[Only suggest values if background information was provided]

### Master Command:
[Single line summarizing the core objective]

### Enhanced Prompt:
[Enhanced version of the prompt incorporating best practices]

IMPORTANT RULES:
- Format questions under clear pillar sections
- Variables should be in plain text without code formatting
- Only pre-fill variable values when background info is provided
- Keep the master command concise and focused
- The enhanced prompt should maintain the original intent while being more specific`;

export const createSystemPrompt = (primaryToggle: string | null, secondaryToggle: string | null, template: any = null) => {
  console.log("Creating system prompt with:", {
    primaryToggle,
    secondaryToggle,
    hasTemplate: !!template,
    templatePillars: template?.pillars?.length || 0,
    isDefaultTemplate: template?.isDefault || false,
    templateId: template?.id || 'none'
  });

  // Generate pillar-specific instructions if template exists
  const pillarSpecificInstructions = template?.pillars ? `
PILLAR SECTIONS:
${template.pillars.map((pillar: any) => `
### ${pillar.title} Questions:
[Generate 2-3 specific questions exploring ${pillar.title} context]
[Questions must directly relate to ${pillar.description}]`).join('\n')}

TEMPLATE METADATA:
Type: ${template.isDefault ? 'Default Framework' : 'Custom Template'}
Template ID: ${template.id}
Temperature: ${template.temperature}
Character Limit: ${template.characterLimit || 'Not specified'}

REQUIREMENTS:
- Each question must be categorized under its specific pillar section
- Questions should help gather requirements for each pillar
- Keep questions focused on pillar objectives
- Format consistently as "### [Pillar Name] Questions:"
` : '';

  // Combine base prompt with pillar instructions
  const finalPrompt = `${basePrompt}

${pillarSpecificInstructions}

${primaryToggle ? `PRIMARY FOCUS: ${primaryToggle}` : ''}
${secondaryToggle ? `SECONDARY FOCUS: ${secondaryToggle}` : ''}`;

  console.log("Final system prompt length:", finalPrompt.length);
  console.log("Has pillar instructions:", !!pillarSpecificInstructions);
  
  return finalPrompt;
};

