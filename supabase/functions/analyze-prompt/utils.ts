
// ─────────────────────────────────────────────────────────────
//  Small shared helper utilities used across the analyze‑prompt
//  edge‑function.  *No* external imports to keep the bundle tiny.
// ─────────────────────────────────────────────────────────────

/**
 * Clamp a string to a maximum number of characters (unicode‑safe).
 * Adds an ellipsis ( … ) when the text is truncated.
 */
export function clamp(str: string, max = 100): string {
  if (!str || typeof str !== "string") return "";
  return str.length <= max ? str : str.slice(0, max - 1).trim() + "…";
}

/**
 * Shorten a string to a nice readable preview – tries to keep words intact.
 * Slightly different from `clamp` because it never appends ellipsis when the
 * string is already short enough.
 */
export function shorten(str: string, max = 80): string {
  if (!str || typeof str !== "string" || str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/**  Very naïve token count used by `computeAmbiguity` – good enough.
 *   Counting spaces ≈ tokens, avoids bringing in extra libs. */
export const countTokens = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/g).length;
};

/** Quick hash helper – not cryptographically secure, just for grouping. */
export const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h >>> 0;
};

// Helper function implementations for generators.ts
export const isCommonWord = (word: string): boolean => {
  const commonWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'by', 'to', 'for', 'with', 'of', 'and', 'or', 'but',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'that', 'this', 
    'these', 'those', 'it', 'its', 'it\'s', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 
    'your', 'he', 'him', 'his', 'she', 'her', 'hers'
  ]);
  return commonWords.has(word.toLowerCase());
};

export const capitalizeFirstLetter = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toCamelCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\s-_]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[\s-_]+/g, '')
    .replace(/^(.)/, (_, c) => c.toLowerCase());
};

export const cleanSubjectText = (text: string): string => {
  if (!text) return '';
  
  // Remove common prefixes like "a", "the", etc.
  const cleanedText = text.replace(/^(a|an|the)\s+/i, '');
  
  // Remove any trailing punctuation
  return cleanedText.replace(/[.,;:!?]+$/, '');
};

// Extract meaningful elements from prompt text
export const extractMeaningfulElements = (promptText: string) => {
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
  // This is a simplified version - in production you might want more sophisticated NLP
  
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
};

// Nothing else here – keep file minimal!

// ─────────────────────────────────────────────────────────────

// NOTE:  Other helpers (computeAmbiguity, organiseQuestionsByPillar) live under
//        utils/questionUtils.ts so they can grow independently without pulling
//        everything into this tiny file.

// EOF
