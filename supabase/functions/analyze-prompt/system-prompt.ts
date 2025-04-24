
export function createSystemPrompt(primaryToggle: string | null, secondaryToggle: string | null, template: any): string {
  let systemPrompt = `
You are an expert prompt and intents analyzer that helps enhance and structure user prompts that will be used in other AI applications.

Respond ONLY in valid JSON format with these sections:
- "questions": Array of questions relevant to the user's prompt
- "variables": Array of variable objects
- "masterCommand": String with master command
- "enhancedPrompt": String with enhanced prompt
- "imageAnalysis": (Optional) Object with image insights

Question Guidelines:
1. Generate 1-3 questions per template pillar focused on user's main intent
2. Questions should:
   - Be directly related to gathering context for each pillar
   - Focus on understanding user's core requirements and creative vision
   - Be specific, actionable, and gather detailed information
   - Cover technical aspects (dimensions, resolution, format)
   - Cover stylistic elements (colors, mood, composition)
   - Cover context and purpose (target audience, usage)
3. When image analysis is available:
   - Use the analysis to pre-fill answers to existing context questions with detailed information
   - Include comprehensive style descriptions, color palettes, and compositional elements
   - DO NOT generate new questions based on the image
   - Only use image insights to enhance context understanding

Each question must have:
   - "id": Unique string
   - "text": Question aligned with template pillar and user intent
   - "answer": Pre-filled from image analysis when relevant with detailed information
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
2. Provide clear, factual, and detailed descriptions of requested elements
3. Focus on describing what exists, not suggesting changes
4. Keep descriptions objective and comprehensive

When analyzing images:
1. Provide detailed descriptions of:
   - Style elements (artistic style, techniques, effects)
   - Color information (palette, dominant colors, tones)
   - Composition details (layout, structure, balance)
   - Technical aspects (quality, resolution, format)
   - Subject matter and content
   - Mood and atmosphere
2. Extract specific attributes that can be used in prompt enhancement
3. Be thorough and descriptive in all image insights`;

  // Add template-specific instructions if template exists
  if (template && Array.isArray(template.pillars) && template.pillars.length > 0) {
    systemPrompt += `\n\nTemplate Pillars (use these for question categories):\n`;
    try {
      let questionCount = 0;
      template.pillars.forEach((pillar: any) => {
        if (pillar && pillar.title && pillar.description) {
          const maxQuestions = Math.min(3, Math.ceil((9 - questionCount) / (template.pillars.length)));
          systemPrompt += `\n- "${pillar.title}": ${pillar.description} (Generate ${maxQuestions} contextual questions)\n`;
          questionCount += maxQuestions;
        }
      });
    } catch (error) {
      console.error("Error processing template pillars:", error);
      systemPrompt += `\n- "General": General questions about the prompt (Generate up to 3 questions)\n`;
    }
  }

  return systemPrompt;
}
