export const generateContextQuestionsForPrompt = (
  promptText: string,
  template: any,
  smartContext: any,
  imageAnalysis: any
) => {
  console.log("Generating questions with context:", {
    hasImageAnalysis: !!imageAnalysis,
    imageAnalysisKeys: imageAnalysis ? Object.keys(imageAnalysis) : []
  });

  const questions = [];
  
  if (imageAnalysis) {
    // Style and Composition Question
    questions.push({
      id: `q-style-${Date.now()}`,
      text: "What are the visual elements and artistic style of the image?",
      answer: `The image exhibits ${imageAnalysis.style || 'distinctive'} characteristics with ${imageAnalysis.composition || 'notable compositional elements'}. The visual treatment includes ${imageAnalysis.technique || 'specific artistic techniques'}, creating a ${imageAnalysis.mood || 'particular mood or atmosphere'}. The color palette consists of ${imageAnalysis.colors || 'various tones'}, while the lighting emphasizes ${imageAnalysis.lighting || 'certain aspects'} of the scene. ${imageAnalysis.details || 'Additional details'} contribute to the overall aesthetic impact.`,
      isRelevant: true,
      category: "Style",
      contextSource: "image"
    });

    // Subject Matter Question
    questions.push({
      id: `q-subject-${Date.now()}`,
      text: "What is the main subject matter and its characteristics?",
      answer: `The primary subject of the image is ${imageAnalysis.subject || 'the main focus'}, characterized by ${imageAnalysis.subjectDetails || 'specific features'}. ${imageAnalysis.arrangement || 'The composition'} places emphasis on ${imageAnalysis.focus || 'key elements'}, while ${imageAnalysis.perspective || 'the viewing angle'} enhances the overall presentation. Notable elements include ${imageAnalysis.elements || 'various components'} that contribute to the narrative or visual interest.`,
      isRelevant: true,
      category: "Content",
      contextSource: "image"
    });

    // Technical Execution Question
    questions.push({
      id: `q-technical-${Date.now()}`,
      text: "What technical aspects are evident in the image creation?",
      answer: `The image demonstrates ${imageAnalysis.technicalAspects || 'specific technical choices'} in its execution. The rendering approach includes ${imageAnalysis.rendering || 'particular methods'}, with ${imageAnalysis.effects || 'various effects'} enhancing the visual impact. The technical quality is evident in ${imageAnalysis.quality || 'certain aspects'}, while ${imageAnalysis.techniques || 'various techniques'} have been employed to achieve the desired result.`,
      isRelevant: true,
      category: "Technical",
      contextSource: "image"
    });
  }

  // Add any template-based questions after image analysis questions
  if (template?.pillars) {
    template.pillars.forEach((pillar, index) => {
      if (pillar.title && pillar.description) {
        questions.push({
          id: `q-${pillar.title}-${index}-${Date.now()}`,
          text: `How does the prompt relate to ${pillar.title}?`,
          answer: smartContext?.context ? `Considering the additional context: ${smartContext.context}, this relates to ${pillar.title} by exploring ${pillar.description}` : `This relates to ${pillar.title} by exploring ${pillar.description}`,
          isRelevant: true,
          category: pillar.title,
          contextSource: "template"
        });
      }
    });
  }

  return questions;
};

export const generateContextualVariablesForPrompt = (
  promptText: string,
  template: any,
  imageAnalysis: any,
  smartContext: any,
  concise = false
) => {
  const variables = [];

  if (imageAnalysis) {
    // Style Variable
    variables.push({
      id: `var-style-${Date.now()}`,
      name: "Visual Style",
      description: "The overall artistic approach and visual treatment",
      value: `${imageAnalysis.style || ''} ${imageAnalysis.technique || ''} with ${imageAnalysis.mood || 'distinctive characteristics'}`,
      isRelevant: true,
      category: "Style",
      contextSource: "image"
    });

    // Color Scheme Variable
    variables.push({
      id: `var-colors-${Date.now()}`,
      name: "Color Palette",
      description: "The color scheme and lighting characteristics",
      value: `${imageAnalysis.colors || ''} complemented by ${imageAnalysis.lighting || 'specific lighting effects'}`,
      isRelevant: true,
      category: "Visual",
      contextSource: "image"
    });

    // Composition Variable
    variables.push({
      id: `var-composition-${Date.now()}`,
      name: "Composition",
      description: "The arrangement and focal points of the image",
      value: `${imageAnalysis.composition || ''} featuring ${imageAnalysis.arrangement || ''} with ${imageAnalysis.focus || 'key elements'}`,
      isRelevant: true,
      category: "Layout",
      contextSource: "image"
    });
  }

  // Add any template-based variables after image variables
  if (template?.pillars) {
    template.pillars.forEach((pillar, index) => {
      if (pillar.title) {
        variables.push({
          id: `var-${pillar.title}-${index}-${Date.now()}`,
          name: pillar.title,
          description: pillar.description || `Variable related to ${pillar.title}`,
          value: concise ? pillar.title : `Details related to ${pillar.title} from the template.`,
          isRelevant: true,
          category: pillar.title,
          contextSource: "template"
        });
      }
    });
  }

  return variables;
};
