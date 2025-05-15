
import { Question, Variable } from '../types.ts';

// a small whitelist of common color names for "red ball" detection
const COLORS = new Set([
  'red','blue','green','yellow','black','white','pink','purple',
  'orange','grey','gray','brown','gold','silver','teal','cyan','magenta'
]);

// Add a STOP set for filtering out common/useless variable names
const STOP = new Set(['this','that','these','those','it','they','them','he','she','we','you','i','me']);

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any,
  smartContextData: any = null,
  imageAnalysis: any = null,
  userIntent: string = ""
): any[] {
  const questions: any[] = [];
  let questionId = 1;

  // Extract pillars from the template
  const pillars = template?.pillars || [];

  // Add questions based on template pillars
  pillars.forEach((pillar: any) => {
    const pillarTitle = pillar.title;
    const promptSnippet = smartContextData?.context || userIntent || promptText;

    // Generate suggestions based on the pillar and prompt snippet
    const suggestions = pillarSuggestions(pillar.id, pillarTitle, promptSnippet);

    suggestions.forEach(suggestion => {
      questions.push({
        id: `question-${questionId++}`,
        text: suggestion.txt,
        category: pillarTitle,
        examples: suggestion.ex || []
      });
    });
  });

  return questions;
}

// ─────────────────────────────────────────────────────────────
// Pillar-aware question bank  (feel free to extend later)
// ─────────────────────────────────────────────────────────────
const pillarSuggestions = (pillarId: string, pillarTitle: string, promptSnippet = "") => {
  const id = pillarId.toLowerCase();
  const short = promptSnippet.length > 60
    ? promptSnippet.slice(0, 57) + "…"
    : promptSnippet;

  // ─── explicit banks for Aitema X core pillars ───────────────────────────
  if (pillarId === '1' || pillarTitle.toLowerCase() === 'task') {
    return [
      { txt: "What is the primary objective you want to achieve?",         ex: ['increase sales', 'generate leads', 'improve user retention'] },
      { txt: "Are there any specific deliverables or outputs needed?",     ex: ['PDF report', 'PowerPoint deck', 'API endpoint'] },
      { txt: "Who is the target audience for this task?",                  ex: ['marketing manager', 'end customer', 'internal developer'] }
    ];
  }
  if (pillarId === '2' || pillarTitle.toLowerCase() === 'persona') {
    return [
      { txt: "What role or expertise should the AI assume when responding?",  ex: ['financial advisor', 'creative writer', 'data scientist'] },
      { txt: "What tone or style should the response have?",                 ex: ['formal', 'conversational', 'persuasive'] },
      { txt: "Is there any background information about the user to consider?", ex: ['technical level', 'industry sector', 'experience level'] }
    ];
  }
  if (pillarId === '3' || pillarTitle.toLowerCase() === 'conditions') {
    return [
      { txt: "Are there any constraints or rules the output must follow?",       ex: ['under 500 words', 'uses US English', 'no jargon'] },
      { txt: "What assumptions can the AI make about the context?",              ex: ['budget available', 'tight deadline', 'team size'] },
      { txt: "Do you have any formatting or compliance requirements?",           ex: ['APA citations', 'company branding guidelines', 'accessibility standards'] }
    ];
  }
  if (pillarId === '4' || pillarTitle.toLowerCase() === 'instructions') {
    return [
      { txt: "Is there a specific process or sequence to follow?",             ex: ['step-by-step tutorial', 'chronological order', 'priority-based'] },
      { txt: "Should the output include extra examples or illustrations?",     ex: ['code snippets', 'sample use cases', 'visual diagrams'] },
      { txt: "Do you need the answer delivered in a particular format?",        ex: ['JSON', 'bullet points', 'table'] }
    ];
  }
  // ────────────────────────────────────────────────────────────────────────

  // IMAGE-GENERATION TEMPLATE
  if (id === 'subject') return [
    { txt: "What is the main subject's pose or action?", ex: ['running','sitting','jumping'] },
    { txt: "Any composition guidelines?",             ex: ['rule-of-thirds','centre focus','symmetry'] },
    { txt: "Camera angle preference?",                ex: ["eye level","bird's-eye","low angle"] }
  ];

  if (id === 'style') return [   // Art Style
    { txt: "Which visual style best fits?",           ex: ['water-colour','comic','photorealistic'] },
    { txt: "Do you prefer a specific era or genre?",  ex: ['80s retro','futuristic','baroque'] },
    { txt: "Any colour-palette constraints?",         ex: ['brand colours','monochrome','pastel set'] }
  ];

  if (id === 'mood') return [    // Mood & Light
    { txt: "What feeling should the image evoke?",    ex: ['playful','serene','dramatic'] },
    { txt: "Is the mood subtle or bold?",             ex: ['soft pastels','vibrant neon','gritty noir'] },
    { txt: "What lighting conditions do you want?",   ex: ['sunset glow','studio lighting','high contrast'] }
  ];

  if (id === 'setting' || id === 'environment') return [  // Setting / Environment
    { txt: "Where is the scene set?",                 ex: ['beach','city park','outer space'] },
    { txt: "Time of day or season?",                  ex: ['sunset','winter morning','mid-day'] },
    { txt: "Should the background be detailed or minimal?", ex: ['detailed','clean white','blurred'] }
  ];

  if (id === 'palette') return [  // Palette
    { txt: "Which colours are your primary focus?",   ex: ['red and gold','pastels','monochrome'] },
    { txt: "Any specific hex codes or brand colours?", ex: ['#FF5733','#1A1A1A'] },
    { txt: "Do you want high contrast or harmony?",   ex: ['bold contrast','soft gradients'] }
  ];

  // CODE-CREATION TEMPLATE
  if (id === 'goal') return [
    { txt: "What is the exact goal of the code, including one input-output example?", ex: ['input: 2+2 → output: 4'] },
    { txt: "How will you validate success?", ex: ['unit tests','console logs','manual review'] }
  ];
  if (id === 'language') return [
    { txt: "Which language and version should be used?", ex: ['Node.js 18','Python 3.10','Go 1.20'] },
    { txt: "Any libraries or frameworks to include or exclude?", ex: ['no external libs','use Lodash'] }
  ];
  if (id === 'essentials') return [
    { txt: "List key inputs, edge cases, performance or security needs.", ex: ['handle zero values','protect against XSS'] },
    { txt: "Should there be tests baked in?", ex: ['Jest','pytest','no tests'] }
  ];
  if (id === 'guidelines') return [
    { txt: "What style or compliance rules?", ex: ['PEP8','OWASP','Google JS Style'] },
    { txt: "Any comment or documentation requirements?", ex: ['JSDoc','docstrings'] }
  ];
  if (id === 'drop-in-spot') return [
    { txt: "Where will this code live (CLI tool, web endpoint, etc.)?", ex: ['AWS Lambda','Express route'] },
    { txt: "What exports or handlers are expected?", ex: ['module.exports','export default'] }
  ];

  // default – weave the user's intent into the question
  const obj = short        // e.g. "an image of a dog playing…"
               .replace(/^create\s+(an|a)?\s*/i, '')  // trim verbs
               .replace(/^\w+\s+of\s+/i, '');         // "image of …" → "…"

  return [
    {
      txt: `For **${obj}**, what ${pillarTitle.toLowerCase()} details are still missing?`,
      ex: []   // examples get added later by addFallbackExamples()
    }
  ];
};

// Helper functions
const isCommonWord = (word: string): boolean => {
  const commonWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'by', 'to', 'for', 'with', 'of', 'and', 'or', 'but',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'that', 'this', 
    'these', 'those', 'it', 'its', 'it\'s', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 
    'your', 'he', 'him', 'his', 'she', 'her', 'hers'
  ]);
  return commonWords.has(word.toLowerCase());
};

const capitalizeFirstLetter = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const toCamelCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\s-_]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[\s-_]+/g, '')
    .replace(/^(.)/, (_, c) => c.toLowerCase());
};

const cleanSubjectText = (text: string): string => {
  if (!text) return '';
  
  // Remove common prefixes like "a", "the", etc.
  const cleanedText = text.replace(/^(a|an|the)\s+/i, '');
  
  // Remove any trailing punctuation
  return cleanedText.replace(/[.,;:!?]+$/, '');
};

// Extract meaningful elements from prompt text
const extractMeaningfulElements = (promptText: string) => {
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

export function generateContextualVariablesForPrompt(
  promptText: string,
  template: any,
  imageAnalysis: any = null,
  smartContextData: any = null
) {
  const variables: any[] = [];
  let variableId = 1;

  // Extract initial variables from smartContextData
  if (smartContextData?.variables && Array.isArray(smartContextData.variables)) {
    smartContextData.variables.forEach(variable => {
      if (variable.name && variable.code) {
        variables.push({
          id: `var-${variableId++}`,
          name: variable.name,
          value: variable.value || '',
          isRelevant: true,
          category: variable.category || 'General',
          code: variable.code
        });
      }
    });
  }
  
  const elements = extractMeaningfulElements(promptText);
  console.log("Extracted meaningful elements:", JSON.stringify(elements, null, 2));

  // Generate variables for subjects (most important)
  elements.subjects.forEach(subject => {
    const raw = subject.text.trim().toLowerCase();
    // 1) detect simple "<color> <object>" pattern → make "<Object> Color = <color>"
    const m = raw.match(/^([a-z]+)\s+([a-z]+)$/);
    if (m && COLORS.has(m[1])) {
      const [ , color, noun ] = m;
      variables.push({
        id: `var-${variableId++}`,
        name: `${capitalizeFirstLetter(noun)} Color`,
        value: color,
        isRelevant: true,
        category: 'Color',
        code: toCamelCase(`${noun}Color`)
      });
      return; // skip the generic‐subject fallback
    }

    // 2) Otherwise fall back to generic subject var
    const rawClean = subject.text.trim();
    if (rawClean.length < 3 || isCommonWord(rawClean)) return;
    const cleaned = cleanSubjectText(rawClean);
    const key = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (STOP.has(key) || key === '') return;

    const variableName = capitalizeFirstLetter(cleaned) + (subject.context ? ` (${subject.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Subject',
      code: toCamelCase(cleaned)
    });
  });

  // Generate variables for styles
  elements.styles.forEach(style => {
    if (style.text.length < 3 || isCommonWord(style.text)) return;
    const cleaned = style.text.trim();
    const variableName = capitalizeFirstLetter(cleaned) + (style.context ? ` (${style.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Style',
      code: toCamelCase(cleaned)
    });
  });

  // Generate variables for mood
  elements.moods.forEach(mood => {
    if (mood.text.length < 3 || isCommonWord(mood.text)) return;
    const cleaned = mood.text.trim();
    const variableName = capitalizeFirstLetter(cleaned) + (mood.context ? ` (${mood.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Mood',
      code: toCamelCase(cleaned)
    });
  });

  // Generate variables for environment
  elements.environments.forEach(environment => {
    if (environment.text.length < 3 || isCommonWord(environment.text)) return;
    const cleaned = environment.text.trim();
    const variableName = capitalizeFirstLetter(cleaned) + (environment.context ? ` (${environment.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Environment',
      code: toCamelCase(cleaned)
    });
  });

  // Generate variables for art concepts
  elements.artConcepts.forEach(concept => {
    if (concept.text.length < 3 || isCommonWord(concept.text)) return;
    const cleaned = concept.text.trim();
    const variableName = capitalizeFirstLetter(cleaned) + (concept.context ? ` (${concept.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Art Concept',
      code: toCamelCase(cleaned)
    });
  });

  return variables;
}
