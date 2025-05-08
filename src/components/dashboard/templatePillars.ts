
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
        id: "1",
        title: "Language & Framework",
        description: "Specify the programming language, framework, or technology stack you want to use."
      },
      {
        id: "2",
        title: "Functionality",
        description: "Describe what the code should do, including inputs, outputs, and expected behaviors."
      },
      {
        id: "3",
        title: "Style & Best Practices",
        description: "Specify any coding style, patterns, or best practices you want followed."
      },
      {
        id: "4",
        title: "Documentation",
        description: "Indicate if you need comments, function documentation, or any other explanations."
      }
    ],
    role: "You are an expert software developer with deep knowledge across multiple programming languages and frameworks.",
    temperature: 0.6
  },
  "code-debugging": {
    id: "code-debugging",
    pillars: [
      {
        id: "1",
        title: "Error Description",
        description: "Paste the error message or describe the unexpected behavior you're experiencing."
      },
      {
        id: "2",
        title: "Code Snippet",
        description: "Provide the relevant code that's causing the error or issue."
      },
      {
        id: "3",
        title: "Environment",
        description: "Describe your development environment, including language version, framework, and dependencies."
      },
      {
        id: "4",
        title: "Expected Behavior",
        description: "Explain what you expect the code to do when working correctly."
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
        id: "1",
        title: "Data Description",
        description: "Describe the data and metrics you want to analyze (sales figures, user engagement, market trends)."
      },
      {
        id: "2",
        title: "Time Period",
        description: "Specify the timeframe you're analyzing and any relevant comparison periods."
      },
      {
        id: "3",
        title: "Insights Needed",
        description: "Indicate what specific insights or patterns you're looking to uncover."
      },
      {
        id: "4",
        title: "Target Audience",
        description: "Specify who will be reading this summary and their technical expertise level."
      }
    ],
    role: "You are a data analyst who excels at identifying meaningful patterns in complex datasets.",
    temperature: 0.6
  },
  "chart-generation": {
    id: "chart-generation",
    pillars: [
      {
        id: "1",
        title: "Data Set",
        description: "Provide or describe the data you want to visualize."
      },
      {
        id: "2",
        title: "Chart Type",
        description: "Specify the preferred chart type or ask for a recommendation."
      },
      {
        id: "3",
        title: "Styling & Branding",
        description: "Describe any color schemes, fonts, or branding elements to include."
      },
      {
        id: "4",
        title: "Audience & Purpose",
        description: "Explain who will view this chart and what decisions it should inform."
      }
    ],
    role: "You are a data visualization expert who knows how to present complex data clearly and beautifully.",
    temperature: 0.6
  },
  "statistical-analysis": {
    id: "statistical-analysis",
    pillars: [
      {
        id: "1",
        title: "Data Description",
        description: "Describe your dataset, including variables, sample size, and collection method."
      },
      {
        id: "2",
        title: "Analysis Goal",
        description: "Specify what you want to learn from this data (correlation, significance, prediction)."
      },
      {
        id: "3",
        title: "Statistical Method",
        description: "Suggest or request a specific statistical test or approach."
      },
      {
        id: "4",
        title: "Explanation Level",
        description: "Indicate how technical you want the explanation to be."
      }
    ],
    role: "You are a statistician who can select and apply appropriate statistical methods to any dataset.",
    temperature: 0.5
  },
  "data-executive-summary": {
    id: "data-executive-summary",
    pillars: [
      {
        id: "1",
        title: "Data Overview",
        description: "Briefly describe the data/analysis being summarized."
      },
      {
        id: "2",
        title: "Key Findings",
        description: "List the most important discoveries or conclusions."
      },
      {
        id: "3",
        title: "Business Impact",
        description: "Explain how these findings affect business operations, strategy, or revenue."
      },
      {
        id: "4",
        title: "Recommended Actions",
        description: "Suggest concrete next steps based on the analysis."
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
        id: "1",
        title: "Request/Purpose",
        description: "Clearly state what you're asking for or informing about."
      },
      {
        id: "2",
        title: "Context",
        description: "Provide relevant background information or rationale."
      },
      {
        id: "3",
        title: "Key Points",
        description: "List the main points or arguments that support your request."
      },
      {
        id: "4",
        title: "Call to Action",
        description: "Specify exactly what you want the recipient to do after reading."
      }
    ],
    role: "You are an expert business communicator who crafts clear, persuasive executive communications.",
    temperature: 0.7
  },
  "project-planning": {
    id: "project-planning",
    pillars: [
      {
        id: "1",
        title: "Project Goal",
        description: "Define the overall objective and success criteria."
      },
      {
        id: "2",
        title: "Scope & Deliverables",
        description: "List what will be created or accomplished."
      },
      {
        id: "3",
        title: "Timeline & Milestones",
        description: "Outline key dates and project phases."
      },
      {
        id: "4",
        title: "Resources & Risks",
        description: "Identify required team members, budget, and potential challenges."
      }
    ],
    role: "You are a seasoned project manager who knows how to plan and execute complex initiatives.",
    temperature: 0.6
  },
  "business-idea": {
    id: "business-idea",
    pillars: [
      {
        id: "1",
        title: "Problem & Solution",
        description: "Describe the problem and how your idea solves it."
      },
      {
        id: "2",
        title: "Target Market",
        description: "Define who will use or buy your product/service."
      },
      {
        id: "3",
        title: "Business Model",
        description: "Explain how you'll make money and create value."
      },
      {
        id: "4",
        title: "Competitive Advantage",
        description: "Identify what makes your idea unique or better than alternatives."
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
        id: "1",
        title: "Topic & Angle",
        description: "Specify your subject and the unique perspective you're taking."
      },
      {
        id: "2",
        title: "Target Audience",
        description: "Describe who will be reading this blog post."
      },
      {
        id: "3",
        title: "Key Points",
        description: "List the main ideas you want to cover."
      },
      {
        id: "4",
        title: "SEO & Style",
        description: "Include any keywords to target and tone/voice preferences."
      }
    ],
    role: "You are a professional content writer who creates engaging, SEO-optimized blog posts.",
    temperature: 0.7
  },
  "article-drafting": {
    id: "article-drafting",
    pillars: [
      {
        id: "1",
        title: "Topic & Thesis",
        description: "State your subject and main argument or perspective."
      },
      {
        id: "2",
        title: "Sources & Research",
        description: "Provide or request specific research points and credible sources."
      },
      {
        id: "3",
        title: "Structure",
        description: "Outline how you want the article organized."
      },
      {
        id: "4",
        title: "Audience & Publication",
        description: "Specify who will read this and where it might be published."
      }
    ],
    role: "You are a journalist or feature writer who crafts well-researched, compelling articles.",
    temperature: 0.7
  },
  "executive-summary": {
    id: "executive-summary",
    pillars: [
      {
        id: "1",
        title: "Source Material",
        description: "Describe or provide the document/report being summarized."
      },
      {
        id: "2",
        title: "Key Findings",
        description: "Highlight the most important information to extract."
      },
      {
        id: "3",
        title: "Context & Significance",
        description: "Explain why this information matters to the reader."
      },
      {
        id: "4",
        title: "Format & Length",
        description: "Specify your preferred format and maximum length."
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
        id: "1",
        title: "Platform",
        description: "Specify which social media platform(s) this is for."
      },
      {
        id: "2",
        title: "Content Goals",
        description: "Explain what you want this post to achieve."
      },
      {
        id: "3",
        title: "Brand Voice",
        description: "Describe your brand's tone and personality."
      },
      {
        id: "4",
        title: "Call to Action",
        description: "Specify what you want users to do after seeing this post."
      }
    ],
    role: "You are a social media copywriter who creates engaging posts optimized for different platforms.",
    temperature: 0.8
  },
  "advertising-copy": {
    id: "advertising-copy",
    pillars: [
      {
        id: "1",
        title: "Product/Service",
        description: "Describe what you're advertising."
      },
      {
        id: "2",
        title: "Target Audience",
        description: "Define who you're trying to reach."
      },
      {
        id: "3",
        title: "Unique Selling Point",
        description: "Explain what makes your offering special or better than alternatives."
      },
      {
        id: "4",
        title: "Ad Format & Platform",
        description: "Specify where this ad will appear and any format restrictions."
      }
    ],
    role: "You are an advertising copywriter who creates compelling, conversion-focused ad copy.",
    temperature: 0.8
  },
  "product-descriptions": {
    id: "product-descriptions",
    pillars: [
      {
        id: "1",
        title: "Product Details",
        description: "Describe the product's features, specifications, and materials."
      },
      {
        id: "2",
        title: "Target Customer",
        description: "Define who would buy this product and why."
      },
      {
        id: "3",
        title: "Benefits & Use Cases",
        description: "Explain how this product solves problems or improves life."
      },
      {
        id: "4",
        title: "Brand Voice",
        description: "Describe your brand's tone and personality."
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
        id: "1",
        title: "Genre & Setting",
        description: "Specify the story's genre and world/time period."
      },
      {
        id: "2",
        title: "Main Characters",
        description: "Describe the key characters and their motivations."
      },
      {
        id: "3",
        title: "Conflict",
        description: "Explain the central problem or challenge to be overcome."
      },
      {
        id: "4",
        title: "Arc & Resolution",
        description: "Outline how you want the story to develop and resolve."
      }
    ],
    role: "You are a story consultant who helps writers develop compelling plots and narrative structures.",
    temperature: 0.9
  },
  "character-development": {
    id: "character-development",
    pillars: [
      {
        id: "1",
        title: "Basic Character Info",
        description: "Provide the character's name, age, role in the story, etc."
      },
      {
        id: "2",
        title: "Backstory",
        description: "Describe key events that shaped who this character is."
      },
      {
        id: "3",
        title: "Personality & Motivations",
        description: "Explain how this character thinks, acts, and what drives them."
      },
      {
        id: "4",
        title: "Arc & Growth",
        description: "Describe how you want this character to change throughout the story."
      }
    ],
    role: "You are a character development specialist who creates multi-dimensional, believable characters.",
    temperature: 0.8
  },
  "chapter-writing": {
    id: "chapter-writing",
    pillars: [
      {
        id: "1",
        title: "Story Context",
        description: "Briefly explain what's happened in the story so far."
      },
      {
        id: "2",
        title: "Chapter Purpose",
        description: "Describe what this chapter needs to accomplish in the overall story."
      },
      {
        id: "3",
        title: "Key Scenes",
        description: "List the main events or moments that should happen in this chapter."
      },
      {
        id: "4",
        title: "Tone & Style",
        description: "Specify the writing style and emotional tone for this chapter."
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
        id: "1",
        title: "Subject",
        description: "Describe what you want to see in the image."
      },
      {
        id: "2",
        title: "Style & Aesthetic",
        description: "Specify the artistic style, time period, or visual treatment."
      },
      {
        id: "3",
        title: "Composition",
        description: "Describe how elements should be arranged in the frame."
      },
      {
        id: "4",
        title: "Technical Details",
        description: "Specify any camera settings, lighting, colors, or other technical aspects."
      }
    ],
    role: "You are an expert at crafting detailed prompts that generate high-quality AI images.",
    temperature: 0.8
  },
  "image-variations": {
    id: "image-variations",
    pillars: [
      {
        id: "1",
        title: "Base Concept",
        description: "Describe the original image or concept you want variations of."
      },
      {
        id: "2",
        title: "Elements to Vary",
        description: "Specify which aspects should change between variations."
      },
      {
        id: "3",
        title: "Elements to Keep",
        description: "Identify what should remain consistent across all variations."
      },
      {
        id: "4",
        title: "Variation Range",
        description: "Indicate how different or similar the variations should be."
      }
    ],
    role: "You are a creative director who can generate multiple cohesive visual directions from a single concept.",
    temperature: 0.8
  },
  "product-visualization": {
    id: "product-visualization",
    pillars: [
      {
        id: "1",
        title: "Product Specifications",
        description: "Provide detailed information about the product's appearance and dimensions."
      },
      {
        id: "2",
        title: "Setting & Context",
        description: "Describe where and how the product should be shown."
      },
      {
        id: "3",
        title: "Style & Rendering",
        description: "Specify the visual style and level of realism."
      },
      {
        id: "4",
        title: "Branding Elements",
        description: "Include any logos, colors, or brand guidelines to incorporate."
      }
    ],
    role: "You are a product visualization specialist who creates realistic 3D renderings of products.",
    temperature: 0.7
  },
  "logo-creation": {
    id: "logo-creation",
    pillars: [
      {
        id: "1",
        title: "Brand/Company Info",
        description: "Describe the business, its values, and target audience."
      },
      {
        id: "2",
        title: "Design Elements",
        description: "Suggest symbols, shapes, or concepts you want incorporated."
      },
      {
        id: "3",
        title: "Style & Aesthetics",
        description: "Specify preferred colors, typography style, and overall look."
      },
      {
        id: "4",
        title: "Usage Context",
        description: "Explain where the logo will primarily be used (web, print, signage, etc.)."
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
        id: "1",
        title: "Video Concept",
        description: "Describe the overall concept and purpose of the video."
      },
      {
        id: "2",
        title: "Visual Style",
        description: "Specify the desired look, feel, and visual treatment."
      },
      {
        id: "3",
        title: "Assets & Resources",
        description: "List available footage, images, or elements to include."
      },
      {
        id: "4",
        title: "Length & Structure",
        description: "Indicate desired video length and content flow."
      }
    ],
    role: "You are a video production specialist who creates polished, engaging video content.",
    temperature: 0.7
  },
  "video-script": {
    id: "video-script",
    pillars: [
      {
        id: "1",
        title: "Video Purpose",
        description: "Explain what this video should accomplish."
      },
      {
        id: "2",
        title: "Target Audience",
        description: "Describe who will be watching this video."
      },
      {
        id: "3",
        title: "Key Messages",
        description: "List the main points that must be conveyed."
      },
      {
        id: "4",
        title: "Tone & Style",
        description: "Specify the desired tone (formal, conversational, humorous, etc.)."
      }
    ],
    role: "You are a video scriptwriter who creates clear, engaging scripts that meet communication objectives.",
    temperature: 0.7
  },
  "video-storyboard": {
    id: "video-storyboard",
    pillars: [
      {
        id: "1",
        title: "Script/Concept",
        description: "Provide the script or describe what happens in the video."
      },
      {
        id: "2",
        title: "Visual Direction",
        description: "Describe the desired visual style and camera techniques."
      },
      {
        id: "3",
        title: "Scenes & Transitions",
        description: "List the key scenes and how they connect."
      },
      {
        id: "4",
        title: "Audio Elements",
        description: "Specify music, sound effects, and audio treatment."
      }
    ],
    role: "You are a storyboard artist who translates concepts into clear visual sequences.",
    temperature: 0.7
  },
  "educational-video": {
    id: "educational-video",
    pillars: [
      {
        id: "1",
        title: "Learning Objectives",
        description: "State what viewers should learn or be able to do after watching."
      },
      {
        id: "2",
        title: "Content & Concepts",
        description: "List the key information that needs to be covered."
      },
      {
        id: "3",
        title: "Target Audience",
        description: "Describe the learners' prior knowledge and needs."
      },
      {
        id: "4",
        title: "Format & Engagement",
        description: "Specify how to structure the content for maximum learning (examples, visuals, etc.)."
      }
    ],
    role: "You are an instructional designer who creates clear, effective educational videos.",
    temperature: 0.6
  }
};
