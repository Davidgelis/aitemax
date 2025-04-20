
/**
 * Creates the system prompt for the AI analysis based on user preferences and selected template
 */
export function createSystemPrompt(primaryToggle: string | null, secondaryToggle: string | null, template: any): string {
  // Base system prompt
  let systemPrompt = `
You are an expert prompt analyzer and enhancer. Your task is to analyze the user's prompt and identify customizable elements.

Respond ONLY in valid JSON format according to these strict guidelines:

1. Structure your response as a JSON object with these exact sections:
   - "questions": An array of question objects
   - "variables": An array of variable objects  
   - "masterCommand": A string containing a master command
   - "enhancedPrompt": A string containing an enhanced version of the original prompt
   - "imageAnalysis": (Optional) An object containing insights from image analysis

2. Format for "questions" array:
   Each question object must have:
   - "id": A unique string identifier (e.g., "q-1", "q-2")
   - "text": The actual question text
   - "answer": Default is empty string, unless pre-filled from analysis
   - "isRelevant": Boolean null by default
   - "category": Must match one of the template pillars exactly
   - "contextSource": (Optional) Origin of pre-filled data ("image", "prompt", "smartContext")

3. Format for "variables" array:
   Each variable object must have:
   - "id": A unique string identifier (e.g., "v-1", "v-2")
   - "name": Descriptive name for the variable
   - "value": Default or extracted value
   - "isRelevant": Boolean true by default
   - "category": A category name 
   - "code": A short code for template use (e.g., "VAR_1")

4. Generate at least 8 variables across these categories:
   - "Core Task": Purpose, output type, subject
   - "Technical": Dimensions, quality, constraints
   - "Style": Aesthetic, tone, colors
   - "Context": Audience, intent, usage

5. Pre-fill values whenever possible:
   - From the prompt text
   - From image analysis (mark with "contextSource": "image")
   - From smart context (mark with "contextSource": "smartContext")
   
6. For each question, assign to exactly one category that matches a template pillar.
`;

  // Add template-specific instructions if a template is provided
  if (template && Array.isArray(template.pillars) && template.pillars.length > 0) {
    // Add template information
    systemPrompt += `\n\nYou must use the following template pillars for categorizing questions:\n`;
    
    // Add each pillar with its description
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title && pillar.description) {
        systemPrompt += `\n- "${pillar.title}": ${pillar.description}\n`;
      }
    });
    
    // Emphasize strict categorization requirements
    systemPrompt += `\nIMPORTANT: All questions MUST be categorized using EXACTLY these pillar names. Use the pillar descriptions to guide the types of questions you generate for each category.`;
  } else {
    // Default categorization if no template is provided
    systemPrompt += `\n\nUse these default categories for questions:
- "Task": Questions about what needs to be done
- "Persona": Questions about the target audience or perspective
- "Conditions": Questions about the style, tone, or constraints
- "Instructions": Questions about specific steps or methodology
`;
  }

  // Add toggle-specific instructions
  if (primaryToggle) {
    systemPrompt += `\n\nPrimary focus selected: "${primaryToggle}". Generate questions and variables specifically relevant to this theme.\n`;
  }
  
  if (secondaryToggle) {
    systemPrompt += `\n\nSecondary focus selected: "${secondaryToggle}". Include some questions and variables related to this aspect as well.\n`;
  }

  // Add final reminders about format
  systemPrompt += `
Remember:
1. Your entire response must be valid JSON that can be parsed with JSON.parse()
2. Do not include any text outside the JSON object
3. Format all questions by category, matching exactly the template pillar names
4. Ensure at least 8 variables are generated, pre-filled when possible
5. Include a "masterCommand" that summarizes the overall intent
6. Include an "enhancedPrompt" that builds on the original

RESPOND ONLY WITH VALID JSON.
`;

  return systemPrompt;
}
