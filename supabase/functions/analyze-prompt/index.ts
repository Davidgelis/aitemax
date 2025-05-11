
// ─────────────────────────────────────────────────────────────
// Pillar-aware question bank  (feel free to extend later)
// ─────────────────────────────────────────────────────────────
const pillarSuggestions = (pillar: string, promptSnippet = "") => {
  const short = promptSnippet.length > 60
    ? promptSnippet.slice(0, 57) + "…"
    : promptSnippet;

  const p = pillar.toLowerCase();
  if (p.includes('mood')) return [
    { txt: "What feeling should the image evoke?", ex: ['playful', 'serene', 'dramatic'] },
    { txt: "Is the mood subtle or bold?",            ex: ['soft pastels', 'vibrant neon', 'gritty noir'] },
    { txt: "What is the main intention of the image?", ex: ['social ad', 'personal gift', 'storytelling'] }
  ];
  if (p.includes('style')) return [
    { txt: "Which visual style best fits?",           ex: ['water-colour', 'comic', 'photorealistic'] },
    { txt: "Do you prefer a specific era or genre?",  ex: ['80s retro', 'futuristic', 'baroque'] },
    { txt: "Any colour palette constraints?",         ex: ['brand colours', 'monochrome', 'pastel set'] }
  ];
  if (p.includes('environment')) return [
    { txt: "Where is the scene set?",                 ex: ['beach', 'city park', 'outer space'] },
    { txt: "Time of day or season?",                  ex: ['sunset', 'winter morning', 'mid-day'] },
    { txt: "Should the background be detailed or minimal?", ex: ['detailed', 'clean white', 'blurred'] }
  ];
  if (p.includes('subject')) return [
    { txt: "What is the main subject's pose or action?", ex: ['running', 'sitting', 'jumping'] },
    { txt: "Any composition guidelines?",             ex: ['rule-of-thirds', 'centre focus', 'symmetry'] },
    { txt: "Camera angle preference?",                ex: ["eye level", "bird's-eye", "low angle"] }
  ];

  // default – weave the user's intent into the question
  const obj = short        // e.g. "an image of a dog playing…"
               .replace(/^create\s+(an|a)?\s*/i, '')  // trim verbs
               .replace(/^\w+\s+of\s+/i, '');         // "image of …" → "…"

  return [
    {
      txt: `For **${obj}**, what ${pillar.toLowerCase()} details are still missing?`,
      ex: []   // examples get added later by addFallbackExamples()
    }
  ];
};
