
import React, { useState, useMemo } from 'react';
import { Info, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { templatePillarsMap } from './templatePillars';

// Template categories with subcategories
type TemplateSubcategory = {
  id: string;
  title: string;
  description: string;
};

type TemplateCategory = {
  id: string;
  name: string;
  subcategories: TemplateSubcategory[];
};

const templateCategories: TemplateCategory[] = [
  {
    id: "code",
    name: "Code Generation & Debugging",
    subcategories: [
      {
        id: "code-creation",
        title: "Code Creation",
        description: "Turn your idea into production-ready code without wrestling with syntax or style rules."
      },
      {
        id: "code-debugging",
        title: "Code Debugging",
        description: "Paste your error—let the template zero-in on the fix, test it, and hand back a clean pass."
      }
    ]
  },
  {
    id: "data",
    name: "Data Analysis & Insights",
    subcategories: [
      {
        id: "trend-summaries",
        title: "Trend Summaries",
        description: "Hand over raw numbers and get a story that tells what's shifting—and why it matters—at a glance."
      },
      {
        id: "chart-generation",
        title: "Chart Generation",
        description: "Feed your data and branding cues—walk away with the perfect chart (or ready-to-run code) in seconds."
      },
      {
        id: "statistical-analysis",
        title: "Statistical Analysis",
        description: "Skip the stats textbooks—get the right test, clear reasoning, and plain-English takeaways in one shot."
      },
      {
        id: "data-executive-summary",
        title: "Data Executive Summary",
        description: "Transform dense analytics into a one-page brief that moves leaders from \"So what?\" to \"Let's act.\""
      }
    ]
  },
  {
    id: "business",
    name: "Business",
    subcategories: [
      {
        id: "executive-email",
        title: "Executive Email",
        description: "Craft a concise, persuasive email that lands approvals—no rewrite loop required."
      },
      {
        id: "project-planning",
        title: "Project Planning",
        description: "Pop in your vision—walk out with a roadmap, roles, timeline, and risk chart your team can adopt today."
      },
      {
        id: "business-idea",
        title: "Business Idea",
        description: "Shape your spark into an investor-ready concept—problem, market fit, money model, and test plan all distilled."
      }
    ]
  },
  {
    id: "long-form",
    name: "Long-Form Content Writing",
    subcategories: [
      {
        id: "blog-post-drafting",
        title: "Blog Post Drafting",
        description: "Turn topics into SEO-smart, reader-friendly posts—structure, key points, and CTA included."
      },
      {
        id: "article-drafting",
        title: "Article Drafting",
        description: "From thesis to polished narrative—get magazine-quality drafts backed by credible sources."
      },
      {
        id: "executive-summary",
        title: "Executive Summary",
        description: "Boil a 50-page report into a 1-page action brief leaders will actually read—then act on."
      }
    ]
  },
  {
    id: "marketing",
    name: "Marketing & Ad Copy",
    subcategories: [
      {
        id: "social-media-post",
        title: "Social Media Post",
        description: "Create thumb-stopping posts tuned to platform rules, brand tone, and follower cravings."
      },
      {
        id: "advertising-copy",
        title: "Advertising Copy",
        description: "Distill offers into razor-sharp ads that stop scrolls and spark clicks."
      },
      {
        id: "product-descriptions",
        title: "Product Descriptions & Tagline",
        description: "Convert features into benefits and benefits into sales—plus a snappy tagline to seal the deal."
      }
    ]
  },
  {
    id: "creative",
    name: "Creative Writing & Storytelling",
    subcategories: [
      {
        id: "story-plot",
        title: "Story Plot and Outline",
        description: "Jump-start your novel with a solid arc, living world, and ready-to-write scene roadmap."
      },
      {
        id: "character-development",
        title: "Character Development",
        description: "Breathe life into characters with rounded backstories, motives, and growth arcs."
      },
      {
        id: "chapter-writing",
        title: "Chapter Writing",
        description: "Move your plot forward with a scene drafted for pace, voice, and a hook that begs the next page."
      }
    ]
  },
  {
    id: "visual",
    name: "Visual Art & Image Generation",
    subcategories: [
      {
        id: "image-generation",
        title: "Image Generation",
        description: "Speak your picture and get a studio-grade AI prompt ready for Midjourney or DALL-E."
      },
      {
        id: "image-variations",
        title: "Image Variations",
        description: "Spin limitless fresh looks from one base concept while keeping brand fingerprints intact."
      },
      {
        id: "product-visualization",
        title: "Product Visualization",
        description: "Turn specs into polished, on-brand 3-D renders that sell before you manufacture."
      },
      {
        id: "logo-creation",
        title: "Logo Creation",
        description: "Distill your brand essence into a mark that pops on every screen and sign."
      }
    ]
  },
  {
    id: "video",
    name: "Video Scripting & Planning",
    subcategories: [
      {
        id: "video-generation",
        title: "Video Generation",
        description: "Feed assets and guidelines—receive a polished, brand-aligned video script and shot list."
      },
      {
        id: "video-script",
        title: "Video Script Writing",
        description: "Transform talking points into a scene-by-scene script ready for camera or AI voice."
      },
      {
        id: "video-storyboard",
        title: "Video Storyboard",
        description: "Map every shot, sound, and second before you hit record or render."
      },
      {
        id: "educational-video",
        title: "Educational Video Scripting",
        description: "Build lesson videos that teach, engage, and confirm mastery—no instructional-design degree required."
      }
    ]
  }
];

/* ------------------------------------------------------------------ */
/*  Description text for tooltip                                       */
/* ------------------------------------------------------------------ */
const AITEMA_X_DESCRIPTION =
  "The Aitema X default multi-pillar framework – build structured prompts fast with variables and step logic.";

export const TemplateMegaMenu = () => {
  // single source of truth from the global hook
  const { selectTemplate, templates, currentTemplate, lastSource, systemState } = useTemplateManagement();

  /* ----------------------------------------------------------------
     Detect the real framework template ID dynamically (first match
     marked isDefault or named "Aitema X Framework").  Fallback to
     "default" so nothing breaks in dev data.  Memoised on template
     list so it never flickers.
  ---------------------------------------------------------------- */
  const frameworkId = useMemo(() => {
    const fw = templates?.find(
      t => t.isDefault || t.name === "Aitema X Framework"
    );
    return fw?.id ?? "default";
  }, [templates]);

  const [activeCategory, setActiveCategory] = useState<string | null>("user-templates"); // Set user-templates as default
  const [isOpen, setIsOpen] = useState(false);

  // Separate templates into default/system and user-created
  const userTemplates = useMemo(() => 
    templates?.filter(template => 
      !template.isDefault && 
      !templateCategories.some(cat => 
        cat.subcategories.some(sub => sub.id === template.id)
      )
    ) || [], 
  [templates]);

  // clicking any system template OR the framework line
  const handleTemplateSelect = (templateId: string, isUserTemplate = false) => {
    if (templateId === frameworkId) {
      selectTemplate(frameworkId, "system", null);      // bare framework
    } else if (isUserTemplate) {
      selectTemplate(templateId, "user", null);         // user template
    } else {
      // Check if this subcategory has specialized pillars
      const hasSpecializedPillars = templatePillarsMap[templateId] !== undefined;
      selectTemplate(frameworkId, "system", templateId); // system sub-template
      
      if (hasSpecializedPillars) {
        console.log(`Using specialized pillars for: ${templateId}`);
      }
    }
    setIsOpen(false);
  };

  // -----------------------------------------------
  // Build the button label (mega-menu trigger text)
  // -----------------------------------------------
  const buttonLabel = useMemo(() => {
    // If a user template is selected
    if (lastSource === "user" && currentTemplate && !currentTemplate.isDefault) {
      return currentTemplate.name;
    }

    /* Show sub-template ONLY if the mega-menu was picked last */
    if (lastSource === "system" && systemState.subId) {
      for (const cat of templateCategories) {
        const match = cat.subcategories.find(s => s.id === systemState.subId);
        if (match) return match.title;
      }
    }

    /* Show framework name */
    if (currentTemplate?.id === frameworkId) {
      return "Aitema X Framework";
    }

    /* Fallback (defensive) */
    return "X Templates";
  }, [systemState.subId, currentTemplate, frameworkId, lastSource]);

  // Find the Aitema X Framework template in the templates list
  const aitemaXTemplate = templates?.find(t => t.id === frameworkId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[220px] justify-between bg-[#f2fbf7] border-[#64bf95] hover:border-[#33fea6] transition-colors"
        >
          {buttonLabel}
          <span className="ml-2 opacity-60">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[800px] p-0 bg-white border border-[#64bf95] shadow-lg rounded-lg"
        align="start"
        sideOffset={5}
      >
        <div className="flex">
          {/* Categories sidebar */}
          <div className="w-[200px] p-2 border-r border-[#64bf95]/20 bg-[#f2fbf7]">
            {/* My Templates at the top with white background */}
            {userTemplates.length > 0 && (
              <div className="mb-4 px-3 py-2 bg-white rounded-md border border-[#64bf95]/20">
                <div 
                  className={cn(
                    "px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                    activeCategory === "user-templates"
                      ? "bg-white text-gray-500 border border-gray-300" 
                      : "hover:bg-white hover:text-[#33fea6] hover:border hover:border-[#33fea6] text-gray-500 border border-gray-300" 
                  )}
                  onClick={() => setActiveCategory("user-templates")}
                >
                  My Templates
                </div>
              </div>
            )}

            <div className="mb-4 px-3 py-2 bg-[#64bf95]/10 rounded-md">
              <div 
                className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded-md hover:bg-[#33fea6]/20 transition-colors"
                onClick={() => {
                  if (aitemaXTemplate) {
                    handleTemplateSelect(aitemaXTemplate.id);
                  }
                }}
              >
                <div className="w-2 h-2 rounded-full bg-[#33fea6]"></div>
                <span className="font-medium text-[#041524]">Aitema X Framework</span>
                {/* tooltip icon */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="inline-flex items-center justify-center rounded-full p-0.5 text-[#64bf95] hover:bg-[#64bf95]/10 hover:text-[#33fea6] transition-colors"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] bg-[#041524] text-white">
                      <p>{AITEMA_X_DESCRIPTION}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {templateCategories.map(category => (
                <div 
                  key={category.id}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                    activeCategory === category.id 
                      ? "bg-[#084b49] text-white" 
                      : "hover:bg-[#64bf95]/10 text-[#041524]"
                  )}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </div>
          
          {/* Subcategories content */}
          <div className="flex-1 p-4 max-h-[450px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#084b49]">
                {activeCategory === "user-templates" 
                  ? "My Templates"
                  : activeCategory 
                    ? templateCategories.find(c => c.id === activeCategory)?.name 
                    : "Select a Category"}
              </h3>
              {/* Custom close button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {activeCategory === "user-templates" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userTemplates.map(template => (
                  <div 
                    key={template.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-[#64bf95]/30 hover:border-[#33fea6] hover:bg-[#f2fbf7] transition-all cursor-pointer"
                    onClick={() => handleTemplateSelect(template.id, true)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.pillars?.length || 0} pillars • Created: {template.createdAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templateCategories
                  .find(c => c.id === activeCategory)
                  ?.subcategories.map(subcategory => (
                    <div 
                      key={subcategory.id}
                      className="flex items-center gap-2 p-3 rounded-lg border border-[#64bf95]/30 hover:border-[#33fea6] hover:bg-[#f2fbf7] transition-all cursor-pointer"
                      onClick={() => handleTemplateSelect(subcategory.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{subcategory.title}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="inline-flex items-center justify-center rounded-full p-0.5 text-[#64bf95] hover:bg-[#64bf95]/10 hover:text-[#33fea6] transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[250px] bg-[#041524] text-white">
                                <p>{subcategory.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <p>Select a category from the sidebar to view templates</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
