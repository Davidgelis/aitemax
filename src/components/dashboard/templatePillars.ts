
import { PillarType } from "@/hooks/useTemplateManagement";

// Type definition for template pillar configurations
export interface TemplatePillarConfig {
  id: string;
  pillars: PillarType[];
  role?: string;
  temperature?: number;
}

// Mapping of template subcategory IDs to their specific pillars
export const templatePillarsMap: Record<string, TemplatePillarConfig> = {
  // Code Generation & Debugging
  "code-creation": {
    id: "code-creation",
    pillars: [
      {
        id: "goal",
        title: "Goal",
        description: "Describe exactly what the program must do, including one concrete input-output example so the AI knows success when it sees it."
      },
      {
        id: "language",
        title: "Language",
        description: "Name the language, version, and any libraries you insist on—or forbid—so the AI writes compatible code and flags gaps like [Library Needed]."
      },
      {
        id: "essentials",
        title: "Essentials",
        description: "List key inputs, edge cases, performance or security targets the code must satisfy; the AI will bake tests or sanity checks into the prompt."
      },
      {
        id: "guidelines",
        title: "Guidelines",
        description: "Provide style, comment, or compliance rules (e.g., PEP 8, OWASP) so the AI keeps the code deploy-grade."
      },
      {
        id: "drop-in-spot",
        title: "Drop-In Spot",
        description: "Explain where this code will live (CLI tool, web endpoint, embed in app) so the AI supplies the right exports, main method, or handler wrapper."
      }
    ],
    role: "You are an expert software developer with deep knowledge across multiple programming languages and frameworks.",
    temperature: 0.6
  },
  "code-debugging": {
    id: "code-debugging",
    pillars: [
      {
        id: "problem",
        title: "Problem",
        description: "Summarise what's breaking and what \"all clear\" looks like."
      },
      {
        id: "snippet",
        title: "Snippet",
        description: "Supply the smallest code chunk that reproduces the bug."
      },
      {
        id: "files",
        title: "Files",
        description: "List the relevant file names or paths (e.g., auth.js, Dockerfile) so the AI can reference them instead of the full code."
      },
      {
        id: "setup",
        title: "Setup",
        description: "Note OS, language version, and dependency versions."
      },
      {
        id: "tried",
        title: "Tried Already",
        description: "Record fixes you've attempted to avoid repeats."
      },
      {
        id: "proof",
        title: "Proof",
        description: "Describe the test or check that must pass post-fix."
      }
    ],
    role: "You are an expert debugging specialist who can identify and fix errors in any programming language.",
    temperature: 0.5
  },

  // Data Analysis & Insights
  "trend-summaries": {
    id: "trend-summaries",
    pillars: [
      {
        id: "question",
        title: "Question",
        description: "State the single trend or puzzle you need untangled."
      },
      {
        id: "scope",
        title: "Data Scope",
        description: "Outline date range, key fields, and record volume."
      },
      {
        id: "files",
        title: "Files",
        description: "Name the dataset files or tables (e.g., sales_Q1.csv, BigQuery.table_orders)."
      },
      {
        id: "metrics",
        title: "Metrics",
        description: "Point out which numbers drive the business."
      },
      {
        id: "lens",
        title: "Reader Lens",
        description: "Describe who'll read this."
      },
      {
        id: "next",
        title: "Next Move",
        description: "Say what action the summary should spark."
      }
    ],
    role: "You are a data analyst who excels at identifying meaningful patterns in complex datasets.",
    temperature: 0.6
  },
  "chart-generation": {
    id: "chart-generation",
    pillars: [
      {
        id: "story",
        title: "Story",
        description: "Explain the insight the chart must spotlight."
      },
      {
        id: "columns",
        title: "Data Columns",
        description: "List sample rows or key fields."
      },
      {
        id: "files",
        title: "Files",
        description: "Provide data file names or sheet tabs (e.g., marketing_leads.xlsx – Sheet 2)."
      },
      {
        id: "pick",
        title: "Chart Pick",
        description: "Request a type or let the AI choose."
      },
      {
        id: "branding",
        title: "Brand Look",
        description: "Give palette, fonts, or style notes."
      },
      {
        id: "output",
        title: "Delivery",
        description: "Specify image, slide, or code output."
      }
    ],
    role: "You are a data visualization expert who knows how to present complex data clearly and beautifully.",
    temperature: 0.6
  },
  "statistical-analysis": {
    id: "statistical-analysis",
    pillars: [
      {
        id: "hypothesis",
        title: "Hypothesis",
        description: "Write your expected outcome or comparison."
      },
      {
        id: "data-rules",
        title: "Data Rules",
        description: "Note sample size and quirks."
      },
      {
        id: "files",
        title: "Files",
        description: "List dataset files or database tables (e.g., experiment_A.parquet)."
      },
      {
        id: "test-bounds",
        title: "Test Bounds",
        description: "Mention preferred or banned tests."
      },
      {
        id: "sig-level",
        title: "Sig Level",
        description: "Set alpha or CI targets."
      },
      {
        id: "digest-style",
        title: "Digest Style",
        description: "Indicate who will read the results."
      }
    ],
    role: "You are a statistician who can select and apply appropriate statistical methods to any dataset.",
    temperature: 0.5
  },
  "data-executive-summary": {
    id: "data-executive-summary",
    pillars: [
      {
        id: "headline",
        title: "Headline Insights",
        description: "List must-mention findings."
      },
      {
        id: "impact",
        title: "Business Impact",
        description: "Explain why each insight matters."
      },
      {
        id: "files",
        title: "Files",
        description: "Reference the source files or dashboards (e.g., looker_studio_report.qr)."
      },
      {
        id: "evidence",
        title: "Evidence Links",
        description: "Point to charts or stats that prove the claim."
      },
      {
        id: "tone",
        title: "Tone",
        description: "Define formality and jargon level."
      },
      {
        id: "action",
        title: "Action Path",
        description: "State the decisions or tasks that should follow."
      }
    ],
    role: "You are a business intelligence expert who translates complex data into executive-ready insights.",
    temperature: 0.7
  },

  // Business
  "executive-email": {
    id: "executive-email",
    pillars: [
      {
        id: "outcome",
        title: "Outcome",
        description: "Name the one decision or sign-off you need; the AI frames every sentence toward that ask."
      },
      {
        id: "audience",
        title: "Audience",
        description: "Sketch recipients' roles and familiarity so tone and length hit the mark."
      },
      {
        id: "key-point",
        title: "Key Point",
        description: "Provide the must-remember line; AI spotlights it in the opening."
      },
      {
        id: "facts",
        title: "Facts",
        description: "Drop in the essential numbers, links, or attachments; AI references them without clutter."
      },
      {
        id: "deadline",
        title: "Deadline & CTA",
        description: "State action, owner, and drop-dead date; AI closes with a courteous but firm call."
      }
    ],
    role: "You are an expert business communicator who crafts clear, persuasive executive communications.",
    temperature: 0.7
  },
  "project-planning": {
    id: "project-planning",
    pillars: [
      {
        id: "objective",
        title: "Objective",
        description: "Define what \"project success\" means in a single goal statement."
      },
      {
        id: "scope",
        title: "Scope",
        description: "Spell out what's covered and what's not; the AI locks boundaries and flags scope creep."
      },
      {
        id: "team",
        title: "Team",
        description: "List names or roles and capacity notes; AI auto-assigns tasks and identifies gaps."
      },
      {
        id: "milestones",
        title: "Milestones",
        description: "Provide key dates or phases; AI builds a timeline and dependencies."
      },
      {
        id: "risks",
        title: "Risks",
        description: "Share known threats; AI adds mitigations and surfaces blind spots like [Risk Owner Needed]."
      }
    ],
    role: "You are a seasoned project manager who knows how to plan and execute complex initiatives.",
    temperature: 0.6
  },
  "business-idea": {
    id: "business-idea",
    pillars: [
      {
        id: "pain",
        title: "Pain",
        description: "Describe the customer headache and why current fixes fall short."
      },
      {
        id: "solution",
        title: "Solution Sketch",
        description: "Outline how your idea relieves that pain better or cheaper."
      },
      {
        id: "market",
        title: "Market Scene",
        description: "Add size numbers, trends, and key rivals; AI positions differentiation."
      },
      {
        id: "revenue",
        title: "Revenue Path",
        description: "Explain how cash flows and scales; AI can drop sample numbers or [Pricing TBD]."
      },
      {
        id: "proof",
        title: "Proof Plan",
        description: "List MVP, pilot, or survey steps; AI arranges them as a timeline to validation."
      }
    ],
    role: "You are an entrepreneurial advisor who helps shape business ideas into viable ventures.",
    temperature: 0.8
  },

  // Long-Form Content Writing
  "blog-post-drafting": {
    id: "blog-post-drafting",
    pillars: [
      {
        id: "topic",
        title: "Topic & Angle",
        description: "State subject plus fresh take; AI avoids generic filler."
      },
      {
        id: "reader",
        title: "Reader",
        description: "Describe audience pain points and level; AI tailors tone, length, and examples."
      },
      {
        id: "outline",
        title: "Outline",
        description: "Provide must-hit headings or ask AI to draft a logical flow."
      },
      {
        id: "facts",
        title: "Facts & Stories",
        description: "Add quotes, stats, or anecdotes; AI weaves them with citations."
      },
      {
        id: "seo",
        title: "SEO & CTA",
        description: "Drop target keyword and desired action; AI optimises headline, meta, and closing hook."
      }
    ],
    role: "You are a professional content writer who creates engaging, SEO-optimized blog posts.",
    temperature: 0.7
  },
  "article-drafting": {
    id: "article-drafting",
    pillars: [
      {
        id: "thesis",
        title: "Thesis",
        description: "State the argument or investigative question; AI threads every section to prove it."
      },
      {
        id: "sources",
        title: "Sources",
        description: "List studies, interviews, or datasets; AI cites them APA-style or flags [Citation Needed]."
      },
      {
        id: "arc",
        title: "Arc",
        description: "Choose chronology, mystery-reveal, or problem-solution; AI stages tension and payoff."
      },
      {
        id: "voices",
        title: "Voices",
        description: "Provide expert quotes; AI blends them in with smooth transitions."
      },
      {
        id: "style",
        title: "House Style",
        description: "Give word count, tone guide (neutral, punchy), and audience level; AI obeys."
      }
    ],
    role: "You are a journalist or feature writer who crafts well-researched, compelling articles.",
    temperature: 0.7
  },
  "executive-summary": {
    id: "executive-summary",
    pillars: [
      {
        id: "purpose",
        title: "Purpose",
        description: "Name the decision or alignment this summary must support; AI trims out noise."
      },
      {
        id: "insights",
        title: "Top Insights",
        description: "Drop the five headline findings; AI ranks them and adds [Data Needed] if gaps."
      },
      {
        id: "implications",
        title: "Implications",
        description: "Explain stakes: risk, cost, or upside; AI presents them in bullet impact statements."
      },
      {
        id: "readers",
        title: "Readers",
        description: "State technical depth; AI toggles jargon accordingly."
      },
      {
        id: "next",
        title: "Next Steps",
        description: "List owners and deadlines; AI plugs in a ready checklist."
      }
    ],
    role: "You are an expert in distilling complex information into clear, actionable summaries.",
    temperature: 0.6
  },

  // Marketing & Ad Copy
  "social-media-post": {
    id: "social-media-post",
    pillars: [
      {
        id: "platform",
        title: "Platform",
        description: "Name network and format (reel, carousel, thread); AI fits character caps."
      },
      {
        id: "mood",
        title: "Audience Mood",
        description: "Share what followers love or struggle with; AI strikes the right chord."
      },
      {
        id: "message",
        title: "Message",
        description: "State the feeling or idea to seed; AI crafts copy around it."
      },
      {
        id: "voice",
        title: "Brand Voice",
        description: "Define tone in three adjectives; AI keeps language on-brand."
      },
      {
        id: "cta",
        title: "CTA & Tags",
        description: "Provide link, hashtag, or challenge; AI embeds naturally."
      }
    ],
    role: "You are a social media copywriter who creates engaging posts optimized for different platforms.",
    temperature: 0.8
  },
  "advertising-copy": {
    id: "advertising-copy",
    pillars: [
      {
        id: "offer",
        title: "Offer",
        description: "Describe product benefit, promo, or pain killer; AI leads with it."
      },
      {
        id: "pain",
        title: "Buyer Pain",
        description: "Summarise the itch you scratch; AI mirrors it in headline for empathy."
      },
      {
        id: "emotion",
        title: "Emotion Trigger",
        description: "Pick urgency, trust, awe; AI selects words that evoke it."
      },
      {
        id: "length",
        title: "Length",
        description: "Set character cap and channel rules; AI trims to fit."
      },
      {
        id: "proof",
        title: "Proof",
        description: "Supply stat, testimonial, award; AI drops it in as credibility punch."
      }
    ],
    role: "You are an advertising copywriter who creates compelling, conversion-focused ad copy.",
    temperature: 0.8
  },
  "product-descriptions": {
    id: "product-descriptions",
    pillars: [
      {
        id: "basics",
        title: "Product Basics",
        description: "List standout features or specs; AI won't miss a selling point."
      },
      {
        id: "win",
        title: "Customer Win",
        description: "Describe life after purchase; AI uses benefit-first language."
      },
      {
        id: "story",
        title: "Brand Story",
        description: "Share a line of origin or mission; AI weaves authenticity."
      },
      {
        id: "voice",
        title: "Voice",
        description: "Choose luxurious, playful, eco-smart; AI matches tone with vocab."
      },
      {
        id: "tagline",
        title: "Tagline Aim",
        description: "State emotion or concept to spark; AI delivers options under the word limit."
      }
    ],
    role: "You are a product copywriter who transforms features into compelling benefits that drive sales.",
    temperature: 0.7
  },

  // Creative Writing & Storytelling
  "story-plot": {
    id: "story-plot",
    pillars: [
      {
        id: "premise",
        title: "Premise",
        description: "Give the hook or what-if; AI builds conflict and stakes from it."
      },
      {
        id: "world",
        title: "World",
        description: "Describe time, place, and any special rules; AI keeps consistency notes."
      },
      {
        id: "cast",
        title: "Main Cast",
        description: "List key characters and two defining traits each."
      },
      {
        id: "shape",
        title: "Plot Shape",
        description: "Choose three-act, hero's journey, etc.; AI maps beats."
      },
      {
        id: "themes",
        title: "Themes",
        description: "Name underlying ideas; AI threads symbols and motifs."
      }
    ],
    role: "You are a story consultant who helps writers develop compelling plots and narrative structures.",
    temperature: 0.9
  },
  "character-development": {
    id: "character-development",
    pillars: [
      {
        id: "role",
        title: "Story Role",
        description: "Define their function (hero, foil); AI aligns arc tension."
      },
      {
        id: "history",
        title: "History",
        description: "Outline formative events; AI will ask [Missing Event] if thin."
      },
      {
        id: "traits",
        title: "Traits",
        description: "Provide strengths, quirks, flaws for credible depth."
      },
      {
        id: "motives",
        title: "Motives",
        description: "State what they want and the walls in the way."
      },
      {
        id: "change",
        title: "Change Path",
        description: "Describe how they end up; AI seeds foreshadowing."
      }
    ],
    role: "You are a character development specialist who creates multi-dimensional, believable characters.",
    temperature: 0.8
  },
  "chapter-writing": {
    id: "chapter-writing",
    pillars: [
      {
        id: "goal",
        title: "Scene Goal",
        description: "Say what must change by chapter's end."
      },
      {
        id: "narrator",
        title: "Narrator View",
        description: "Name POV character and tense to keep voice locked."
      },
      {
        id: "backdrop",
        title: "Backdrop",
        description: "Set where and when; AI paints sensory details."
      },
      {
        id: "conflict",
        title: "Conflict",
        description: "Describe stakes or opposition; AI boosts tension beats."
      },
      {
        id: "hook",
        title: "Hook",
        description: "Request a cliff-hanger or reveal; AI lands it in last lines."
      }
    ],
    role: "You are a fiction writer who crafts engaging, purposeful chapters that move stories forward.",
    temperature: 0.8
  },

  // Visual Art & Image Generation
  "image-generation": {
    id: "image-generation",
    pillars: [
      {
        id: "subject",
        title: "Subject",
        description: "Detail the main focus: who/what and key features."
      },
      {
        id: "style",
        title: "Art Style",
        description: "Name influence or medium (ink, Pixar, synthwave)."
      },
      {
        id: "mood",
        title: "Mood & Light",
        description: "Set emotion and lighting cues (noir shadows, sunrise glow)."
      },
      {
        id: "setting",
        title: "Setting",
        description: "Describe environment depth, texture, props."
      },
      {
        id: "palette",
        title: "Palette",
        description: "Give color anchors or brand hex codes; AI balances hues."
      }
    ],
    role: "You are an expert at crafting detailed prompts that generate high-quality AI images.",
    temperature: 0.8
  },
  "image-variations": {
    id: "image-variations",
    pillars: [
      {
        id: "reference",
        title: "Reference",
        description: "Link or describe the base image focus."
      },
      {
        id: "knobs",
        title: "Change Knobs",
        description: "List aspects to vary (pose, angle, palette)."
      },
      {
        id: "steady",
        title: "Keep Steady",
        description: "State elements that must not shift (logo, face)."
      },
      {
        id: "range",
        title: "Style Range",
        description: "Define subtle tweak or bold remix."
      },
      {
        id: "batch",
        title: "Batch & Size",
        description: "Tell how many variants and pixel need."
      }
    ],
    role: "You are a creative director who can generate multiple cohesive visual directions from a single concept.",
    temperature: 0.8
  },
  "product-visualization": {
    id: "product-visualization",
    pillars: [
      {
        id: "specs",
        title: "Specs",
        description: "Provide dimensions, material, and moving parts."
      },
      {
        id: "scene",
        title: "Scene Use",
        description: "Describe real-life setting (kitchen, trail)."
      },
      {
        id: "angle",
        title: "Angle/Detail",
        description: "Ask for hero shot, exploded view, or close-up."
      },
      {
        id: "brand",
        title: "Brand Marks",
        description: "Add color rules and logo placement."
      },
      {
        id: "file",
        title: "File Need",
        description: "State resolution, transparency, or CAD format."
      }
    ],
    role: "You are a product visualization specialist who creates realistic 3D renderings of products.",
    temperature: 0.7
  },
  "logo-creation": {
    id: "logo-creation",
    pillars: [
      {
        id: "values",
        title: "Core Values",
        description: "List mission words the logo should echo."
      },
      {
        id: "style",
        title: "Style Vibe",
        description: "Choose minimalist, retro, geometric, etc.; AI sketches within lane."
      },
      {
        id: "colors",
        title: "Colors",
        description: "Provide palette or emotions they should evoke."
      },
      {
        id: "cases",
        title: "Use Cases",
        description: "Say where logo appears (app icon, merch) for scalability checks."
      },
      {
        id: "competitors",
        title: "Competitors",
        description: "Share rival logos to avoid look-alikes."
      }
    ],
    role: "You are a brand identity designer who creates distinctive, meaningful logos.",
    temperature: 0.8
  },

  // Video Scripting & Planning
  "video-generation": {
    id: "video-generation",
    pillars: [
      {
        id: "purpose",
        title: "Purpose",
        description: "State if the video trains, sells, or inspires; AI matches flow and length."
      },
      {
        id: "assets",
        title: "Assets",
        description: "List clips, images, or text to include; AI flags [Clip Missing] if gaps."
      },
      {
        id: "duration",
        title: "Duration & Size",
        description: "Set run time and aspect (16:9, 9:16)."
      },
      {
        id: "voice",
        title: "Voice Over",
        description: "Describe narrator tone, gender, language."
      },
      {
        id: "brand",
        title: "Brand Frame",
        description: "Give logo sting, color rules, sign-off style."
      }
    ],
    role: "You are a video production specialist who creates polished, engaging video content.",
    temperature: 0.7
  },
  "video-script": {
    id: "video-script",
    pillars: [
      {
        id: "hook",
        title: "Hook",
        description: "Provide opening line or visual jolt; AI grabs viewers fast."
      },
      {
        id: "viewer",
        title: "Viewer",
        description: "Outline age, interest, and current pain; AI writes relatable examples."
      },
      {
        id: "chapters",
        title: "Chapter Points",
        description: "List sections; AI fills dialogue and beats."
      },
      {
        id: "tone",
        title: "Tone",
        description: "Choose engaging, cinematic, educational, etc."
      },
      {
        id: "cta",
        title: "Call-To-Action",
        description: "Spell exact viewer task and placement; AI echoes it on screen and narration."
      }
    ],
    role: "You are a video scriptwriter who creates clear, engaging scripts that meet communication objectives.",
    temperature: 0.7
  },
  "video-storyboard": {
    id: "video-storyboard",
    pillars: [
      {
        id: "scenes",
        title: "Scene List",
        description: "Name each moment's intent; AI assigns frame numbers."
      },
      {
        id: "visual",
        title: "Visual Cue",
        description: "Describe key imagery or reference art."
      },
      {
        id: "audio",
        title: "Audio Line",
        description: "Provide narration, SFX, or music timing."
      },
      {
        id: "camera",
        title: "Camera Move",
        description: "Note angles, zooms, pans for clarity."
      },
      {
        id: "timing",
        title: "Timing",
        description: "Give seconds per shot and transition types."
      }
    ],
    role: "You are a storyboard artist who translates concepts into clear visual sequences.",
    temperature: 0.7
  },
  "educational-video": {
    id: "educational-video",
    pillars: [
      {
        id: "objective",
        title: "Learning Objective",
        description: "State the measurable skill or knowledge gain; AI ties every segment to it."
      },
      {
        id: "level",
        title: "Audience Level",
        description: "Define learner age and prior knowledge so jargon stays on-level."
      },
      {
        id: "steps",
        title: "Topic Steps",
        description: "List checkpoint topics; AI chunks into digestible modules."
      },
      {
        id: "engage",
        title: "Engage Moments",
        description: "Ask for quizzes, pauses, or prompts; AI slots them for retention."
      },
      {
        id: "assessment",
        title: "Assessment & Next Step",
        description: "Describe final quiz, assignment, or link; AI ends with a clear learner action."
      }
    ],
    role: "You are an instructional designer who creates clear, effective educational videos.",
    temperature: 0.6
  }
};
