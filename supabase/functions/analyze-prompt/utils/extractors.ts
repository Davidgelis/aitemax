
// Simple extraction of meaningful elements from prompt text
export function extractMeaningfulElements(promptText: string) {
  // Default empty structure
  const elements = {
    subjects: [] as { text: string; context?: string }[],
    styles: [] as { text: string; context?: string }[],
    moods: [] as { text: string; context?: string }[],
    environments: [] as { text: string; context?: string }[],
    artConcepts: [] as { text: string; context?: string }[]
  };
  
  if (!promptText) return elements;
  
  // Simple extraction based on common patterns
  
  // Extract subjects (nouns)
  const subjectMatches = promptText.match(/(?:a|the|an)\s+(\w+(?:\s+\w+){0,2})/gi) || [];
  subjectMatches.forEach(match => {
    const subject = match.replace(/^(?:a|the|an)\s+/i, '');
    elements.subjects.push({ text: subject });
  });
  
  // Extract styles
  const styleMatches = promptText.match(/(?:in|with)\s+(?:a|the)?\s*(\w+\s+style)/gi) || [];
  styleMatches.forEach(match => {
    const style = match.replace(/^(?:in|with)\s+(?:a|the)?\s*/i, '');
    elements.styles.push({ text: style });
  });
  
  // Extract moods
  const moodKeywords = ['mood', 'feeling', 'atmosphere', 'vibe'];
  moodKeywords.forEach(keyword => {
    const regex = new RegExp(`(\\w+(?:\\s+\\w+){0,2})\\s+${keyword}`, 'gi');
    const matches = promptText.match(regex) || [];
    matches.forEach(match => {
      const mood = match.replace(new RegExp(`\\s+${keyword}$`, 'i'), '');
      elements.moods.push({ text: mood });
    });
  });
  
  // Extract environments
  const envMatches = promptText.match(/(?:in|at)\s+(?:a|the)?\s*(\w+(?:\s+\w+){0,2})\s+(?:setting|environment|location|place|scene)/gi) || [];
  envMatches.forEach(match => {
    const env = match.replace(/^(?:in|at)\s+(?:a|the)?\s*/i, '')
                    .replace(/\s+(?:setting|environment|location|place|scene)$/i, '');
    elements.environments.push({ text: env });
  });
  
  // Extract art concepts
  const artConceptKeywords = ['composition', 'perspective', 'lighting', 'texture', 'pattern', 'effect'];
  artConceptKeywords.forEach(keyword => {
    const regex = new RegExp(`(\\w+(?:\\s+\\w+){0,2})\\s+${keyword}`, 'gi');
    const matches = promptText.match(regex) || [];
    matches.forEach(match => {
      const concept = match.replace(new RegExp(`\\s+${keyword}$`, 'i'), '');
      elements.artConcepts.push({ text: concept + ' ' + keyword });
    });
  });
  
  return elements;
}
