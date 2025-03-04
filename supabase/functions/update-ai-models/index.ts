
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top 5 AI models per provider, focused on the most widely used and recognized models
const aiModels = [
  // OpenAI Models - Top 5
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model with superior performance across text, vision, and reasoning tasks.",
    strengths: [
      "Exceptional multimodal capabilities for processing images and text together",
      "Significantly improved reasoning and problem-solving",
      "Superior performance in academic benchmarks including math, coding, and reasoning",
      "Enhanced instruction following with better alignment to user intent",
      "Improved factual accuracy and reduced hallucinations compared to GPT-4"
    ],
    limitations: [
      "May still produce convincing but incorrect information",
      "Limited by knowledge cutoff date",
      "Cannot browse the internet without explicit integration",
      "Vision capabilities have limits in detailed image analysis",
      "Higher cost compared to smaller models"
    ]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A smaller, faster, and more cost-effective version of GPT-4o that maintains strong performance across general tasks.",
    strengths: [
      "Significantly faster response times than full-sized GPT-4o",
      "Much lower cost per token making it viable for high-volume applications",
      "Good balance of performance and efficiency for most everyday tasks",
      "Maintains core multimodal capabilities for basic image understanding",
      "Suitable for real-time applications requiring low latency"
    ],
    limitations: [
      "Reduced reasoning capabilities on complex tasks compared to GPT-4o",
      "Less robust knowledge in specialized academic domains",
      "More limited ability to handle multi-step instructions in a single prompt",
      "Reduced context window limiting analysis of longer documents",
      "Higher tendency to hallucinate under uncertainty"
    ]
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "OpenAI's efficient and cost-effective language model balancing performance and resource usage.",
    strengths: [
      "Very fast response times with low latency even under high load",
      "Significantly lower cost compared to GPT-4 models",
      "Good general capabilities across a wide range of common tasks",
      "Widely supported with extensive documentation and community resources",
      "Strong performance in conversational contexts and simple writing tasks"
    ],
    limitations: [
      "Substantially less capable on complex reasoning tasks than GPT-4 series",
      "Limited mathematical reasoning and problem-solving abilities",
      "Higher tendency to produce hallucinations or inaccuracies",
      "Less effective at following detailed multi-step instructions",
      "Knowledge cutoff limits awareness of recent events"
    ]
  },
  {
    name: "DALL-E 3",
    provider: "OpenAI",
    description: "OpenAI's advanced text-to-image model generating detailed and creative images from descriptions.",
    strengths: [
      "Exceptional ability to generate photorealistic images from text descriptions",
      "Strong understanding of complex spatial relationships and object compositions",
      "Ability to follow detailed style instructions for consistent artistic renderings",
      "Good handling of abstract concepts and creative interpretations",
      "Improved handling of text within images compared to previous generations"
    ],
    limitations: [
      "Occasional misinterpretation of complex prompts with multiple constraints",
      "Limited ability to generate certain restricted content categories",
      "Inconsistent quality for highly technical or specialized domain imagery",
      "May struggle with very specific brand elements or copyrighted characters",
      "Limited control over fine details compared to professional design tools"
    ]
  },
  {
    name: "Whisper",
    provider: "OpenAI",
    description: "OpenAI's speech-to-text model capable of transcribing and translating audio with high accuracy.",
    strengths: [
      "Strong performance across various accents and difficult audio conditions",
      "Multilingual capabilities supporting dozens of languages",
      "Accurate transcription even with background noise or low-quality audio",
      "Ability to translate directly from foreign language speech to English text",
      "Adaptable to domain-specific terminology with fine-tuning"
    ],
    limitations: [
      "May struggle with extremely specialized technical vocabulary",
      "Occasional difficulties with heavy accents or extremely fast speech",
      "Limited real-time capabilities due to processing requirements",
      "Less accurate with very low-quality audio or significant background noise",
      "Requires careful prompt engineering for optimal performance in specialized domains"
    ]
  },
  
  // Anthropic Models - Top 5
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's flagship model with state-of-the-art reasoning capabilities for professional tasks.",
    strengths: [
      "Industry-leading performance on reasoning tasks requiring careful, multi-step analysis",
      "Exceptional code generation and debugging capabilities with attention to detail",
      "Significantly reduced tendency to hallucinate compared to many competitors",
      "Excellent at following detailed instructions with high precision",
      "Strong performance in specialized professional domains like law and medicine"
    ],
    limitations: [
      "Higher latency and computational requirements than smaller models",
      "Less widespread availability and integration with third-party platforms",
      "Limited context window compared to specialized long-context models",
      "May occasionally be overly cautious when addressing sensitive topics",
      "Higher cost per token compared to smaller models in the Claude family"
    ]
  },
  {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "A balanced model offering strong performance with improved efficiency for general applications.",
    strengths: [
      "Excellent instruction following with high precision and attention to detail",
      "Good balance of quality and speed for most business applications",
      "Significantly reduced hallucination rate compared to industry average",
      "Strong reasoning capabilities for business and analytical tasks",
      "Consistent and predictable outputs across repeated queries"
    ],
    limitations: [
      "Not as powerful as Claude 3 Opus for specialized expert tasks",
      "Limited knowledge cutoff date, missing recent information",
      "May struggle with complex multi-step reasoning in specialized domains",
      "More limited mathematical reasoning compared to Opus",
      "Less advanced coding capabilities than specialized coding models"
    ]
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Anthropic's fastest and most compact model designed for low-latency applications.",
    strengths: [
      "Extremely fast response times suitable for real-time applications",
      "Low cost making it viable for high-volume consumer applications",
      "Good for real-time chat interfaces requiring immediate feedback",
      "Maintains reasonable accuracy on many common tasks despite small size",
      "Effective for straightforward content generation and moderation"
    ],
    limitations: [
      "Significantly reduced capabilities compared to larger Claude models",
      "Limited context window restricting analysis of longer documents",
      "Less effective for complex reasoning or specialized knowledge domains",
      "Higher error rate in mathematical calculations and logical reasoning",
      "More prone to misunderstanding complex or nuanced instructions"
    ]
  },
  {
    name: "Claude 2.1",
    provider: "Anthropic",
    description: "Updated version of Claude 2 with improved performance and instruction following capabilities.",
    strengths: [
      "Better reasoning abilities than Claude 2 across various tasks",
      "Improved coding and mathematical capabilities",
      "Enhanced consistency in following complex instructions",
      "Reduced hallucination tendencies compared to Claude 2",
      "Good balance of capabilities and computational efficiency"
    ],
    limitations: [
      "Not as capable as Claude 3 models across most tasks",
      "Limited context window compared to newer models",
      "More restricted knowledge cutoff compared to Claude 3 series",
      "Less effective multimodal capabilities than latest generation",
      "Higher computational requirements than smaller specialized models"
    ]
  },
  {
    name: "Claude Instant",
    provider: "Anthropic",
    description: "Anthropic's lightweight model designed for high-throughput, cost-effective deployments.",
    strengths: [
      "Very fast inference speed suitable for applications requiring quick responses",
      "Highly cost-effective for large-scale deployments",
      "Good general text understanding for common tasks",
      "Effective for content moderation and classification tasks",
      "Reliable output formatting for simple structured data"
    ],
    limitations: [
      "Significantly less capable on complex reasoning than larger Claude models",
      "Limited ability to handle nuanced or ambiguous instructions",
      "More prone to factual errors and hallucinations",
      "Struggles with multi-step reasoning tasks",
      "Reduced context understanding for subtle conversational nuances"
    ]
  },
  
  // Google Models - Top 5
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model featuring a large context window and improved reasoning capabilities.",
    strengths: [
      "Massive 1 million token context window for analyzing long documents",
      "Sophisticated multimodal understanding across text, images, audio, and video",
      "Strong reasoning capabilities particularly for scientific and technical content",
      "Excellent at maintaining coherence across very long conversations",
      "Efficient processing despite the large context window size"
    ],
    limitations: [
      "May struggle with certain specialized domains outside its training focus",
      "Potential for generating plausible but incorrect information in areas of uncertainty",
      "Less widely tested in production settings than some competitor models",
      "Higher computational requirements when utilizing the full context window",
      "API access restrictions and availability limitations in certain regions"
    ]
  },
  {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    description: "A faster, more efficient version of Google's Gemini 1.5 model designed for high-throughput applications.",
    strengths: [
      "Very fast inference speed suitable for real-time interactive applications",
      "Retains large context window capabilities with efficient processing",
      "Good balance of performance and cost for everyday applications",
      "Maintains core multimodal capabilities with good efficiency",
      "Lower latency for time-sensitive applications"
    ],
    limitations: [
      "Reduced reasoning capabilities compared to Gemini 1.5 Pro",
      "Less adept at solving complex problems requiring deep analysis",
      "May produce more superficial responses to complex queries",
      "Less effective for specialized academic or scientific tasks",
      "Reduced performance on advanced coding and mathematics"
    ]
  },
  {
    name: "Gemini 1.0 Ultra",
    provider: "Google",
    description: "Google's previous generation flagship model with strong general performance across various tasks.",
    strengths: [
      "Robust performance across a wide range of general knowledge tasks",
      "Good reasoning capabilities for analytical problems",
      "Strong performance on coding tasks with context understanding",
      "Effective at summarization and content generation",
      "Well-tested in various production environments"
    ],
    limitations: [
      "Significantly smaller context window than Gemini 1.5 series",
      "More limited multimodal capabilities than newer models",
      "Less effective at maintaining coherence in very long conversations",
      "More likely to produce hallucinations than newer models",
      "Knowledge cutoff date restricts awareness of recent events"
    ]
  },
  {
    name: "Gemini Nano",
    provider: "Google",
    description: "Google's on-device AI model optimized for mobile devices and edge computing applications.",
    strengths: [
      "Designed to run efficiently on device without cloud connectivity",
      "Low latency suitable for real-time mobile applications",
      "Reduced power consumption compared to cloud model inference",
      "Privacy benefits from on-device processing of sensitive data",
      "Optimized for Android ecosystem integration"
    ],
    limitations: [
      "Significantly reduced capabilities compared to cloud-based models",
      "Limited context understanding and reasoning abilities",
      "Restricted to simpler tasks and basic language understanding",
      "Less effective for complex queries requiring deep knowledge",
      "Hardware-dependent performance varies across devices"
    ]
  },
  {
    name: "Imagen",
    provider: "Google",
    description: "Google's text-to-image diffusion model for generating high-quality images from text descriptions.",
    strengths: [
      "Advanced photorealistic image generation from detailed descriptions",
      "Strong spatial reasoning and composition capabilities",
      "Good understanding of specific artistic styles and visual concepts",
      "Ability to generate consistent characters across multiple images",
      "Impressive detail rendering in complex scenes"
    ],
    limitations: [
      "Access limited through specific Google Cloud APIs",
      "Less widespread availability compared to competing image models",
      "May struggle with certain complex abstract concepts",
      "Varying quality for highly specific technical or domain-specialized imagery",
      "More restricted content policy compared to some alternatives"
    ]
  },
  
  // Meta Models - Top 5
  {
    name: "Llama 3 405B",
    provider: "Meta",
    description: "Meta's largest language model with significantly improved reasoning and instruction following capabilities.",
    strengths: [
      "Superior reasoning capabilities approaching top commercial models",
      "Excellent performance on complex coding and mathematical tasks",
      "Strong ability to follow nuanced multi-step instructions",
      "Improved factual accuracy and reduced hallucinations",
      "Better handling of ambiguity and context understanding"
    ],
    limitations: [
      "Extreme hardware requirements limiting widespread deployment",
      "Significantly higher computational cost than smaller Llama variants",
      "Challenging to fine-tune without substantial compute resources",
      "More complex deployment and optimization requirements",
      "Limited available deployment solutions due to size constraints"
    ]
  },
  {
    name: "Llama 3 70B",
    provider: "Meta",
    description: "The most widely used Llama 3 variant offering strong performance with reasonable resource requirements.",
    strengths: [
      "Strong performance across a wide range of tasks approaching proprietary models",
      "Open weights enabling research transparency and customization",
      "Good instruction following with improved alignment over previous generations",
      "Competitive with many closed models at a lower deployment cost",
      "Can be fine-tuned for specific domains with relatively modest resources"
    ],
    limitations: [
      "High hardware requirements for efficient inference (minimum 40GB VRAM)",
      "Less overall training data compared to leading proprietary alternatives",
      "May lag behind top commercial alternatives in specialized domains",
      "More challenging to deploy and maintain than API-based solutions",
      "Limited built-in safety measures compared to heavily aligned models"
    ]
  },
  {
    name: "Llama 3 8B",
    provider: "Meta",
    description: "The smallest variant of Meta's Llama 3 family, optimized for efficiency and edge deployment.",
    strengths: [
      "Extremely efficient with low hardware requirements",
      "Fast inference speed suitable for real-time applications",
      "Can run on consumer hardware including some mobile devices",
      "Good performance-to-size ratio for general tasks",
      "Open weights enabling extensive customization and fine-tuning"
    ],
    limitations: [
      "Limited reasoning capabilities compared to larger models",
      "Struggles with complex multi-step instructions",
      "Less effective for specialized knowledge domains",
      "More prone to hallucinations and factual errors",
      "Reduced context window limiting document analysis"
    ]
  },
  {
    name: "Segment Anything (SAM)",
    provider: "Meta",
    description: "Meta's computer vision foundation model for image segmentation tasks.",
    strengths: [
      "Exceptional image segmentation capabilities across diverse objects",
      "Zero-shot performance on new object categories without specific training",
      "Highly accurate boundary detection even for complex shapes",
      "Ability to work with simple user prompts (points, boxes, or text)",
      "Fast inference suitable for interactive applications"
    ],
    limitations: [
      "Limited to segmentation tasks rather than general vision understanding",
      "May struggle with very small objects or highly occluded scenes",
      "Not designed for tasks beyond segmentation like classification or detection",
      "Requires additional components for complete computer vision pipelines",
      "High memory usage for highest quality model variants"
    ]
  },
  {
    name: "Llama Guard",
    provider: "Meta",
    description: "Meta's specialized model for content moderation and safety alignment.",
    strengths: [
      "Specifically optimized for identifying and filtering harmful content",
      "Fine-grained classification of safety categories",
      "Adaptable safety thresholds for different deployment contexts",
      "Designed to work alongside general purpose LLMs for safety filtering",
      "Open weights allowing customization for specific content policies"
    ],
    limitations: [
      "Narrowly focused on safety evaluation rather than general AI capabilities",
      "May produce false positives in ambiguous or nuanced discussions",
      "Requires integration with other systems for complete safety solution",
      "Cultural and contextual limitations in understanding nuance",
      "Less effective for detecting subtle policy violations"
    ]
  },
  
  // Mistral AI Models - Top 5
  {
    name: "Mistral Large",
    provider: "Mistral AI",
    description: "Mistral AI's flagship model, optimized for performance and versatility across diverse tasks.",
    strengths: [
      "Exceptional performance on reasoning tasks relative to model size",
      "Strong instruction following capabilities with high precision",
      "Competitive with much larger models on many benchmarks",
      "Efficient architecture enabling faster inference than comparable models",
      "Good at generating structured outputs like JSON and XML"
    ],
    limitations: [
      "Less established track record in production compared to models from larger companies",
      "Limited training data compared to the largest models from OpenAI and Anthropic",
      "Smaller developer ecosystem and fewer integration examples",
      "Less documented behavior in edge cases and specialized domains",
      "Limited context window compared to some competitor models"
    ]
  },
  {
    name: "Mistral Small",
    provider: "Mistral AI",
    description: "A compact and efficient model optimized for everyday tasks with good performance to cost ratio.",
    strengths: [
      "Fast inference speed suitable for interactive applications",
      "Good performance-to-size ratio for general tasks",
      "Reliable instruction following for straightforward requests",
      "Efficient architecture requiring modest computational resources",
      "Suitable for deployment in resource-constrained environments"
    ],
    limitations: [
      "Limited reasoning capabilities for complex problem-solving",
      "Less effective at multi-step instructions than larger models",
      "More prone to factual errors in specialized domains",
      "Reduced context understanding for nuanced or ambiguous queries",
      "Smaller context window limiting document analysis"
    ]
  },
  {
    name: "Mistral Embed",
    provider: "Mistral AI",
    description: "Specialized embedding model designed for text representation, semantic search, and similarity tasks.",
    strengths: [
      "Optimized specifically for high-quality text embeddings",
      "Excellent performance on semantic search and retrieval tasks",
      "Strong language understanding for similarity comparisons",
      "Efficient processing suitable for high-volume embedding generation",
      "Good cross-lingual capabilities for multilingual applications"
    ],
    limitations: [
      "Single-purpose model not designed for text generation or chat",
      "Limited to embedding functionality without reasoning capabilities",
      "Not suitable for tasks requiring contextual responses",
      "Requires additional components for complete RAG systems",
      "Less effective for highly specialized domain-specific embeddings without fine-tuning"
    ]
  },
  {
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    description: "Mixture of experts model combining multiple specialized networks for improved performance.",
    strengths: [
      "Efficient architecture providing strong performance at reasonable cost",
      "Mixture of experts approach specializing in different domains",
      "Good reasoning capabilities compared to similarly sized models",
      "Strong instruction following with good precision",
      "Reliable performance across a wide range of general tasks"
    ],
    limitations: [
      "More complex architecture requiring specialized optimization",
      "Higher memory requirements than standard architectures of similar size",
      "Less widespread deployment solutions than simpler architectures",
      "May exhibit inconsistent performance across different domains",
      "More challenging to fine-tune than standard architectures"
    ]
  },
  {
    name: "Codestral",
    provider: "Mistral AI",
    description: "Mistral AI's specialized model for code generation, understanding, and debugging.",
    strengths: [
      "Exceptional performance on coding tasks across multiple programming languages",
      "Strong understanding of code context and software architecture concepts",
      "Effective at debugging and identifying issues in existing code",
      "Good at following precise technical specifications for implementation",
      "Strong performance on code completion and suggestion tasks"
    ],
    limitations: [
      "More specialized focus limiting general text generation capabilities",
      "May suggest patterns that appear correct but contain subtle bugs",
      "Less effective for extremely domain-specific libraries or frameworks",
      "Limited understanding of highly optimized or hardware-specific code patterns",
      "May not always follow best practices for specific language ecosystems"
    ]
  },
  
  // Cohere Models - Top 5
  {
    name: "Command R+",
    provider: "Cohere",
    description: "Cohere's advanced language model for enterprise applications with strong reasoning capabilities.",
    strengths: [
      "Excellent performance on business and enterprise use cases",
      "Strong reasoning capabilities for analytical tasks",
      "Good at following detailed instructions with precision",
      "Specialized knowledge in business, finance, and legal domains",
      "Reliable output formatting for structured data requirements"
    ],
    limitations: [
      "Less widely known and tested than models from larger providers",
      "More limited ecosystem of integration examples and documentation",
      "May exhibit uneven performance across different specialized domains",
      "More restricted availability through Cohere's platform only",
      "Limited context window compared to some competitor models"
    ]
  },
  {
    name: "Command R",
    provider: "Cohere",
    description: "Cohere's general-purpose language model balancing performance and efficiency for enterprises.",
    strengths: [
      "Good balance of performance and efficiency for everyday tasks",
      "Strong enterprise focus with business-oriented capabilities",
      "Reliable instruction following for standard business queries",
      "Well-optimized for RAG applications with good integration",
      "Consistent performance across common business domains"
    ],
    limitations: [
      "Less capable than Command R+ on complex reasoning tasks",
      "More limited performance on highly specialized domains",
      "Reduced context understanding for nuanced queries",
      "Not designed for multimodal inputs like images or audio",
      "Less advanced code generation capabilities than specialized models"
    ]
  },
  {
    name: "Embed",
    provider: "Cohere",
    description: "Specialized embedding model optimized for enterprise search, retrieval, and recommendation systems.",
    strengths: [
      "Industry-leading text embeddings optimized for enterprise search",
      "Excellent performance on similarity and relevance tasks",
      "Specialized versions for different languages and domains",
      "Strong multilingual capabilities with cross-lingual understanding",
      "Optimized for efficient integration with vector databases"
    ],
    limitations: [
      "Single-purpose model focused only on embedding generation",
      "Not designed for text generation or conversational tasks",
      "Requires integration with other components for complete systems",
      "May require domain-specific variants for specialized industries",
      "Less effective for highly technical or niche domains without customization"
    ]
  },
  {
    name: "Coral",
    provider: "Cohere",
    description: "Cohere's latest generation model focusing on enhanced reasoning and specialized tasks.",
    strengths: [
      "Improved reasoning capabilities over previous Cohere models",
      "Better handling of complex, multi-step instructions",
      "Enhanced performance on specialized enterprise domains",
      "Stronger capabilities for structured data extraction and organization",
      "Improved multilingual performance across business contexts"
    ],
    limitations: [
      "Recently released with less extensive production testing",
      "Limited documentation and best practices compared to established models",
      "More restricted availability through enterprise channels",
      "May have inconsistent performance on newer or emerging use cases",
      "Less widespread community knowledge and optimization techniques"
    ]
  },
  {
    name: "Multilingual",
    provider: "Cohere",
    description: "Cohere's specialized model for cross-lingual understanding and translation tasks.",
    strengths: [
      "Exceptional performance across dozens of languages",
      "Strong cross-lingual transfer abilities for consistent understanding",
      "Good at maintaining context and nuance during translation",
      "Effective for multilingual content moderation and classification",
      "Specialized capabilities for low-resource languages compared to competitors"
    ],
    limitations: [
      "More specialized focus limiting performance on some general tasks",
      "Varying quality across different language pairs",
      "Less effective for highly technical or domain-specific content",
      "More limited context window than some general models",
      "Requires specialized prompting techniques for optimal results"
    ]
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process with top 5 models per provider');

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized with service role key');

    // Check if we already have models in the database
    const { data: existingModels, error: checkError } = await supabase
      .from('ai_models')
      .select('id, name, provider')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing models:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }
    
    const hasExistingModels = existingModels && existingModels.length > 0;
    console.log(`Database has existing models: ${hasExistingModels}`);
    
    // Only proceed with update if:
    // 1. No models exist in database, OR
    // 2. We're explicitly forcing an update
    const forceUpdate = req.method === 'POST' && req.headers.get('X-Force-Update') === 'true';
    
    if (hasExistingModels && !forceUpdate) {
      console.log('Models already exist and no force update requested - skipping update');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Models already exist, no update needed',
        skipped: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Clear existing models before inserting new ones to prevent duplicates
    if (hasExistingModels) {
      console.log('Clearing existing models from database');
      const { error: deleteError } = await supabase
        .from('ai_models')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting existing models:', deleteError);
        throw new Error(`Database error when clearing models: ${deleteError.message}`);
      }
    }

    // Insert models, tracking by provider for stats
    console.log(`Inserting ${aiModels.length} models from 5 leading AI providers`);
    let insertedCount = 0;
    let errors = [];
    let providerStats = {};
    
    // Process models in batches for more efficient insertion
    const batchSize = 5;
    for (let i = 0; i < aiModels.length; i += batchSize) {
      const batch = aiModels.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('ai_models')
        .insert(batch.map(model => ({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        })))
        .select();
      
      if (error) {
        console.error(`Error inserting batch starting with model ${batch[0]?.name}:`, error);
        batch.forEach(model => {
          errors.push({ model: model.name, error: error.message });
        });
      } else {
        insertedCount += data.length;
        
        // Track statistics by provider
        data.forEach(model => {
          const provider = model.provider;
          providerStats[provider] = (providerStats[provider] || 0) + 1;
        });
      }
    }

    console.log(`AI models update completed. Successfully inserted ${insertedCount} models.`);
    console.log('Models inserted by provider:', providerStats);
    
    // Return detailed response
    return new Response(JSON.stringify({ 
      success: true, 
      totalModels: aiModels.length,
      insertedModels: insertedCount,
      providerStats,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error updating AI models:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
