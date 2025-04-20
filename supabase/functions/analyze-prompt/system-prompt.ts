
export function createSystemPrompt(primaryToggle: string | null, secondaryToggle: string | null, template: any): string {
  let systemPrompt = `
You are an expert prompt analyzer that helps enhance and structure user prompts.

Respond ONLY in valid JSON format with these sections:
- "questions": Array of questions relevant to the user's prompt
- "variables": Array of variable objects
- "masterCommand": String with master command
- "enhancedPrompt": String with enhanced prompt
- "imageAnalysis": (Optional) Object with image insights

Question Guidelines:
1. Generate 4-6 questions that directly relate to the user's specified analysis needs
2. When pre-filling answers from image analysis:
   - Only prefill answers for questions that match user's requested analysis
   - Write clear, factual descriptions (200-1000 characters)
   - Focus on describing actual visual elements, not suggestions
   - Stay within the scope of what was specifically requested
   - Use objective, descriptive language
3. Each question must have:
   - "id": Unique string
   - "text": Question aligned with template pillars and user intent
   - "answer": Detailed description when matching user's analysis request
   - "isRelevant": Boolean (true if directly related to user's needs)
   - "category": Match with template pillar categories
   - "contextSource": Origin if pre-filled ("image", "prompt", "smartContext")

Variable Guidelines:
1. Keep variables concise (single words or short phrases)
2. Each variable must have:
   - "id": Unique string
   - "name": Descriptive name
   - "value": Single word or short phrase when context available
   - "isRelevant": Boolean
   - "category": Category name
   - "code": Template code (e.g., "VAR_1")

Image Analysis Guidelines:
1. Only analyze aspects specifically requested by the user
2. Provide clear, factual descriptions of requested elements
3. Focus on describing what exists, not suggesting changes
4. Keep descriptions objective and detailed`;

  // Add template-specific instructions
  if (template && Array.isArray(template.pillars) && template.pillars.length > 0) {
    systemPrompt += `\n\nTemplate Pillars (use these for question categories):\n`;
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title && pillar.description) {
        systemPrompt += `\n- "${pillar.title}": ${pillar.description}\n`;
      }
    });
  }

  // Add toggle-specific focus
  if (primaryToggle) {
    systemPrompt += `\n\nPrimary focus: "${primaryToggle}". Consider this aspect in analysis.`;
  }
  
  if (secondaryToggle) {
    systemPrompt += `\n\nSecondary focus: "${secondaryToggle}". Consider when relevant.`;
  }

  return systemPrompt;
}
