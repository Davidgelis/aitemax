
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Updated top 5 AI models per provider, with more diversity and latest variants
const aiModels = [
  // OpenAI Models - Updated with a wider variety
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model with exceptional capabilities across text, vision, and reasoning tasks.",
    strengths: [
      "Integrated multimodal capabilities combining text and vision",
      "Superior reasoning and problem-solving abilities",
      "Strong academic performance across math, coding, and reasoning",
      "Context window of 128k tokens",
      "Enhanced instruction following and alignment"
    ],
    limitations: [
      "May still produce convincing but incorrect information",
      "Knowledge cutoff limits awareness of recent events",
      "Computationally expensive for deployment",
      "Higher latency than smaller models",
      "Vision capabilities have limitations with fine-grained visual analysis"
    ]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A more efficient version of GPT-4o balancing performance with lower computational requirements.",
    strengths: [
      "Faster inference speed than full GPT-4o",
      "Lower cost structure for production use",
      "Maintains basic multimodal capabilities",
      "Good performance for routine tasks and applications",
      "More suitable for real-time applications"
    ],
    limitations: [
      "Reduced reasoning capabilities compared to full GPT-4o",
      "Less robust for complex academic or specialized tasks",
      "More prone to hallucination than larger models",
      "More limited context window",
      "Less effective at handling ambiguous instructions"
    ]
  },
  {
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "An advanced large language model with improved reasoning and a substantial context window.",
    strengths: [
      "128k token context window for analyzing very long documents",
      "Strong reasoning capabilities for complex problems",
      "Better function calling capabilities than earlier GPT models",
      "More recent knowledge cutoff than base GPT-4",
      "Good performance on specialized professional domains"
    ],
    limitations: [
      "Lacks integrated vision capabilities of GPT-4o",
      "Higher latency than smaller models",
      "May produce plausible-sounding but incorrect information",
      "Limited knowledge of events after training cutoff",
      "Occasional difficulty with complex mathematical reasoning"
    ]
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "A fast and cost-effective model balancing performance with efficiency for everyday applications.",
    strengths: [
      "Very fast response time with low latency",
      "Significantly more cost-effective than GPT-4 series",
      "Good general capabilities for common tasks",
      "Widely supported across applications",
      "Effective for straightforward content generation"
    ],
    limitations: [
      "Limited reasoning capabilities compared to GPT-4 series",
      "More prone to hallucinations and factual errors",
      "Struggles with complex, multi-step instructions",
      "Less effective at nuanced understanding of context",
      "More limited mathematical and coding abilities"
    ]
  },
  {
    name: "DALL-E 3",
    provider: "OpenAI",
    description: "Advanced text-to-image model that generates detailed, creative images from textual descriptions.",
    strengths: [
      "Exceptional image quality and photorealism",
      "Strong understanding of complex compositions and spatial relationships",
      "Ability to follow detailed artistic style instructions",
      "Good handling of text elements within images",
      "Impressive creativity for conceptual and abstract prompts"
    ],
    limitations: [
      "Cannot generate certain categories of content (policy restrictions)",
      "Occasional misinterpretation of complex prompts",
      "Limited control over specific image details",
      "May struggle with highly technical or specialized domain imagery",
      "No direct editing capabilities after generation"
    ]
  },
  
  // Anthropic Models - Updated with latest Claude models
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's most powerful model offering exceptional reasoning, instruction following, and reduced hallucination.",
    strengths: [
      "Industry-leading performance on complex reasoning tasks",
      "Exceptional code generation and debugging capabilities",
      "Significantly reduced tendency to hallucinate compared to competitors",
      "Excellent at following detailed, multi-step instructions",
      "Strong performance in specialized professional domains"
    ],
    limitations: [
      "Higher computational requirements and latency than smaller models",
      "More expensive per token than smaller Claude models",
      "Limited context window compared to some specialized models",
      "May be overly cautious in some domains due to alignment",
      "Less widespread integration across platforms than some competitors"
    ]
  },
  {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "A balanced model offering strong performance with improved efficiency for most business applications.",
    strengths: [
      "Excellent balance of quality and speed for most applications",
      "Strong reasoning capabilities for business and analytical tasks",
      "Reduced hallucination rate compared to industry average",
      "Good instruction following with high precision",
      "Cost-effective for production deployment"
    ],
    limitations: [
      "Less powerful than Claude 3 Opus for specialized expert tasks",
      "More limited mathematical reasoning than larger models",
      "Knowledge cutoff limits awareness of recent events",
      "Less advanced coding capabilities than specialized models",
      "May struggle with extremely complex multi-step reasoning"
    ]
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Anthropic's fastest and most lightweight model designed for applications requiring minimal latency.",
    strengths: [
      "Very fast inference speed suitable for real-time applications",
      "Significantly lower cost making it viable for high-volume applications",
      "Good for interactive chat applications requiring immediate feedback",
      "Maintains reasonable accuracy on many common tasks despite small size",
      "Easy integration with mobile and edge applications"
    ],
    limitations: [
      "Substantially reduced capabilities compared to larger Claude models",
      "Limited context window restricting document analysis",
      "Higher error rate in mathematical calculations and reasoning",
      "More prone to misunderstanding complex instructions",
      "Less effective for specialized knowledge domains"
    ]
  },
  {
    name: "Claude 2.1",
    provider: "Anthropic",
    description: "An improved version of Claude 2 with enhanced reliability and performance across various tasks.",
    strengths: [
      "Better reasoning abilities than Claude 2 across various tasks",
      "Improved coding and mathematical capabilities",
      "Enhanced instruction following consistency",
      "Reduced hallucination tendencies compared to earlier versions",
      "Well-tested in production environments"
    ],
    limitations: [
      "Not as capable as Claude 3 models across most tasks",
      "More limited context window than newer models",
      "Less effective multimodal capabilities",
      "More restricted knowledge cutoff date",
      "Higher computational requirements than more efficient newer models"
    ]
  },
  {
    name: "Claude Instant",
    provider: "Anthropic",
    description: "A lightweight model designed for high-throughput, cost-effective applications with good general capabilities.",
    strengths: [
      "Very fast inference speed for time-sensitive applications",
      "Highly cost-effective for large-scale deployments",
      "Good general text understanding for common tasks",
      "Effective for content moderation and classification",
      "Reliable output formatting for structured data"
    ],
    limitations: [
      "Significantly reduced capabilities compared to standard Claude models",
      "Limited ability to handle complex or ambiguous instructions",
      "Higher tendency for factual errors and hallucinations",
      "Struggles with multi-step reasoning tasks",
      "Reduced context understanding for subtle nuances"
    ]
  },
  
  // Google Models - Updated with more Gemini variants
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model with an exceptional context window and strong reasoning abilities.",
    strengths: [
      "Massive 1 million token context window for analyzing very long documents",
      "Sophisticated multimodal understanding across text, images, audio, and video",
      "Strong reasoning capabilities for complex problems",
      "Excellent at maintaining coherence across very long conversations",
      "Efficient token processing despite the large context size"
    ],
    limitations: [
      "API access restrictions in certain regions",
      "Potential for generating plausible but incorrect information",
      "Higher computational requirements for utilizing full context window",
      "Less widely tested in production environments than some competitors",
      "May struggle with specialized technical domains outside its training focus"
    ]
  },
  {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    description: "A more efficient version of Gemini 1.5 optimized for real-time applications requiring low latency.",
    strengths: [
      "Fast inference speed for interactive applications",
      "Maintains large context window capabilities with efficient processing",
      "Good balance of performance and cost for everyday applications",
      "Core multimodal capabilities with improved efficiency",
      "More suitable for mobile and edge deployment"
    ],
    limitations: [
      "Reduced reasoning capabilities compared to Gemini 1.5 Pro",
      "Less effective at solving complex problems requiring deep analysis",
      "May produce more superficial responses to complex queries",
      "Reduced performance on specialized academic or scientific tasks",
      "Less robust for advanced coding and mathematical problems"
    ]
  },
  {
    name: "Gemini 1.0 Ultra",
    provider: "Google",
    description: "Google's previous generation flagship model with strong general capabilities and multimodal understanding.",
    strengths: [
      "Robust performance across general knowledge domains",
      "Good reasoning capabilities for analytical problems",
      "Strong performance on coding tasks with context understanding",
      "Effective summarization and content generation",
      "Well-tested in various production environments"
    ],
    limitations: [
      "Smaller context window than Gemini 1.5 models",
      "More limited multimodal capabilities than newer versions",
      "Less effective at maintaining coherence in very long conversations",
      "More likely to produce hallucinations than newer models",
      "Knowledge cutoff restricts awareness of recent events"
    ]
  },
  {
    name: "Gemini 1.0 Pro",
    provider: "Google",
    description: "A balanced model offering good performance across a range of tasks with reasonable computational requirements.",
    strengths: [
      "Versatile capabilities suitable for a wide range of applications",
      "Good performance on common reasoning and knowledge tasks",
      "Efficient token usage and computational requirements",
      "Reliable text generation and summarization",
      "Accessible through Google AI Studio and Vertex AI"
    ],
    limitations: [
      "Less powerful than Ultra version for complex tasks",
      "Reduced reasoning capabilities for specialized domains",
      "More limited context window than newer models",
      "May struggle with ambiguous or complex instructions",
      "Less effective for highly specialized technical content"
    ]
  },
  {
    name: "Bard",
    provider: "Google",
    description: "Google's conversational AI assistant designed for helpful, grounded interactions (now integrated with Gemini models).",
    strengths: [
      "Optimized for conversational interactions and helpfulness",
      "Direct integration with Google search for information retrieval",
      "Good at explaining complex topics in simple terms",
      "Regular updates with improved capabilities",
      "Designed for safe, helpful responses adhering to strict guidelines"
    ],
    limitations: [
      "Less accessible through API than other models",
      "More restricted in capabilities compared to raw Gemini models",
      "Limited customization options for developers",
      "Strong guardrails may limit performance in some domains",
      "Consumer-focused rather than developer-oriented"
    ]
  },
  
  // Meta Models - Updated with more Llama variants and specialized models
  {
    name: "Llama 3 70B",
    provider: "Meta",
    description: "Meta's most capable open-source language model with state-of-the-art performance approaching proprietary models.",
    strengths: [
      "Open weights enabling research transparency and customization",
      "Performance approaching closed commercial models",
      "Strong instruction following and reasoning capabilities",
      "Good at complex coding and mathematical tasks",
      "Improved alignment reducing harmful outputs"
    ],
    limitations: [
      "High hardware requirements for efficient inference",
      "Less training data compared to leading proprietary alternatives",
      "More challenging to deploy than API-based solutions",
      "May lag behind top commercial models in specialized domains",
      "Limited built-in safety measures compared to heavily aligned models"
    ]
  },
  {
    name: "Llama 3 8B",
    provider: "Meta",
    description: "A compact yet capable model balancing performance with accessibility for deployment on consumer hardware.",
    strengths: [
      "Remarkable performance given its smaller size",
      "Can run on consumer hardware including high-end laptops",
      "Fast inference speed suitable for real-time applications",
      "Open weights enabling extensive fine-tuning and customization",
      "Good instruction following for straightforward tasks"
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
    name: "Llama 2 70B",
    provider: "Meta",
    description: "Meta's previous generation large language model with strong performance across various tasks.",
    strengths: [
      "Well-documented and widely used in production",
      "Extensive community resources and fine-tuned variants",
      "Good performance on general knowledge and reasoning tasks",
      "Open weights enabling customization for specific use cases",
      "Commercial-friendly license for business applications"
    ],
    limitations: [
      "Less capable than newer Llama 3 models",
      "More limited instruction following capabilities",
      "Higher rates of hallucination than recent models",
      "Older knowledge cutoff missing recent information",
      "Less effective alignment compared to newer versions"
    ]
  },
  {
    name: "Code Llama 34B",
    provider: "Meta",
    description: "Specialized variant of Llama tuned specifically for code generation and understanding.",
    strengths: [
      "Exceptional code generation across multiple programming languages",
      "Strong ability to follow coding-specific instructions",
      "Good at explaining and documenting code",
      "Effective at debugging and fixing issues in existing code",
      "Can complete complex coding tasks with context understanding"
    ],
    limitations: [
      "Less effective for general knowledge tasks outside programming",
      "Specialized focus limits performance in other domains",
      "Large size requiring substantial computational resources",
      "May generate syntactically correct but logically flawed code",
      "Less awareness of the newest programming frameworks and libraries"
    ]
  },
  {
    name: "Segment Anything (SAM)",
    provider: "Meta",
    description: "Meta's computer vision foundation model for advanced image segmentation tasks.",
    strengths: [
      "State-of-the-art image segmentation capabilities",
      "Zero-shot performance on new object categories",
      "Highly accurate boundary detection even for complex objects",
      "Works with simple user prompts (points, boxes, or text)",
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
  
  // Mistral AI Models - Updated with latest models
  {
    name: "Mistral Large",
    provider: "Mistral AI",
    description: "Mistral AI's flagship model with exceptional performance across reasoning, coding, and general tasks.",
    strengths: [
      "Strong performance across diverse tasks including reasoning and coding",
      "Excellent instruction following with high precision",
      "Competitive with much larger models on many benchmarks",
      "Effective across multiple languages",
      "Good at generating structured outputs like JSON and XML"
    ],
    limitations: [
      "Less established track record in production than models from larger companies",
      "More restricted availability through Mistral's platform",
      "Limited training data compared to the largest models from OpenAI and Anthropic",
      "Smaller developer ecosystem and fewer integration examples",
      "Less documented behavior in specialized domains"
    ]
  },
  {
    name: "Mistral Medium",
    provider: "Mistral AI",
    description: "A balanced model offering good performance with improved efficiency for most applications.",
    strengths: [
      "Good balance of performance and efficiency",
      "Strong instruction following for common tasks",
      "Effective across multiple languages",
      "Good reasoning and writing capabilities",
      "More cost-effective than larger models"
    ],
    limitations: [
      "Less powerful than Mistral Large for complex tasks",
      "More limited context understanding than larger models",
      "May struggle with highly specialized domain knowledge",
      "Less effective for complex multi-step reasoning",
      "Reduced performance on advanced coding tasks"
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
    name: "Mistral 8x7B",
    provider: "Mistral AI",
    description: "Also known as Mixtral, a mixture-of-experts model with strong performance across various tasks.",
    strengths: [
      "Mixture-of-experts approach providing specialized domain knowledge",
      "Strong performance despite modest parameter count",
      "Good reasoning and coding capabilities",
      "Effective multilingual performance",
      "Reliable across a wide range of tasks"
    ],
    limitations: [
      "Higher memory requirements than standard models of similar size",
      "More complex to optimize and deploy than standard architectures",
      "May show inconsistent performance across different domains",
      "Less widely supported deployment options",
      "Requires specialized knowledge for optimal fine-tuning"
    ]
  },
  {
    name: "Codestral",
    provider: "Mistral AI",
    description: "Mistral AI's specialized model focused on code generation, understanding, and debugging.",
    strengths: [
      "Exceptional performance on coding tasks across multiple languages",
      "Strong understanding of code context and software design patterns",
      "Effective at debugging and identifying issues in existing code",
      "Ability to follow detailed technical specifications for implementation",
      "Good at generating efficient and maintainable code"
    ],
    limitations: [
      "Specialized focus limiting general text generation capabilities",
      "May suggest patterns that appear correct but contain subtle bugs",
      "Less effective for extremely domain-specific libraries or frameworks",
      "Limited understanding of highly optimized or hardware-specific code",
      "May not always follow best practices for newer language ecosystems"
    ]
  },
  
  // Cohere Models - Updated with latest models
  {
    name: "Command R+",
    provider: "Cohere",
    description: "Cohere's most advanced model with superior performance on complex reasoning and specialized tasks.",
    strengths: [
      "Industry-leading performance on enterprise tasks requiring deep reasoning",
      "Excellent at following complex instructions with precision",
      "Superior knowledge in business, finance, and legal domains",
      "Strong retrieval and citation capabilities",
      "Advanced structured output formatting"
    ],
    limitations: [
      "Less widely known and tested than models from larger providers",
      "More limited ecosystem of integration examples",
      "Available primarily through Cohere's platform",
      "May have uneven performance across certain specialized domains",
      "Less extensive documentation than more established models"
    ]
  },
  {
    name: "Command R",
    provider: "Cohere",
    description: "A versatile model balancing performance and efficiency for enterprise applications.",
    strengths: [
      "Good balance of performance and efficiency for everyday tasks",
      "Business-oriented capabilities for enterprise use cases",
      "Strong enterprise focus with relevant domain knowledge",
      "Optimized for RAG applications with good integration",
      "Reliable for structured information extraction"
    ],
    limitations: [
      "Less powerful than Command R+ on complex reasoning tasks",
      "More limited performance in highly specialized domains",
      "Reduced context understanding for nuanced queries",
      "Not designed for multimodal inputs",
      "Less advanced for complex code generation"
    ]
  },
  {
    name: "Command Light",
    provider: "Cohere",
    description: "A lightweight, efficient model designed for high-throughput enterprise applications.",
    strengths: [
      "Very fast response times suitable for production applications",
      "Optimized for enterprise use cases with relevant knowledge",
      "Cost-effective for high-volume deployments",
      "Good performance on straightforward business tasks",
      "Reliable for basic content generation and classification"
    ],
    limitations: [
      "Limited capabilities for complex reasoning or specialized tasks",
      "Less robust for multi-step instructions or complex problems",
      "Higher error rates on ambiguous or nuanced questions",
      "More prone to hallucinations on uncertain topics",
      "Not suitable for advanced technical or scientific reasoning"
    ]
  },
  {
    name: "Embed",
    provider: "Cohere",
    description: "Specialized embedding model optimized for enterprise search, retrieval, and recommendation systems.",
    strengths: [
      "State-of-the-art text embeddings for semantic search applications",
      "Specialized versions for different languages and domains",
      "Strong multilingual capabilities with cross-lingual understanding",
      "Optimized for efficient integration with vector databases",
      "High accuracy on similarity and relevance tasks"
    ],
    limitations: [
      "Single-purpose model only for embedding generation",
      "Not designed for text generation or conversational tasks",
      "Requires integration with other components for complete systems",
      "May require domain-specific variants for specialized industries",
      "Less effective for highly technical domains without customization"
    ]
  },
  {
    name: "Coral",
    provider: "Cohere",
    description: "Cohere's experimental model with enhanced reasoning capabilities for specialized enterprise use cases.",
    strengths: [
      "Advanced reasoning capabilities compared to earlier Cohere models",
      "Better handling of complex, multi-step instructions",
      "Enhanced performance on specialized enterprise domains",
      "Stronger structured data extraction and organization",
      "Improved multilingual performance across business contexts"
    ],
    limitations: [
      "Limited availability through enterprise channels",
      "Recently released with less extensive production testing",
      "More restricted access than standard Command models",
      "May have inconsistent performance on newer use cases",
      "Less documented optimization techniques and best practices"
    ]
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process with diverse set of models per provider');

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

    // Create a map to track unique models by provider/name to prevent duplicates
    const uniqueModels = new Map();
    const dedupedModels = [];
    
    // Deduplicate models
    aiModels.forEach(model => {
      const key = `${model.provider}-${model.name}`;
      if (!uniqueModels.has(key)) {
        uniqueModels.set(key, true);
        dedupedModels.push(model);
      }
    });
    
    console.log(`Deduplication: Original count: ${aiModels.length}, Unique models: ${dedupedModels.length}`);

    // Insert models, tracking by provider for stats
    console.log(`Inserting ${dedupedModels.length} unique models from various AI providers`);
    let insertedCount = 0;
    let errors = [];
    let providerStats = {};
    
    // Process models in batches for more efficient insertion
    const batchSize = 5;
    for (let i = 0; i < dedupedModels.length; i += batchSize) {
      const batch = dedupedModels.slice(i, i + batchSize);
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

    // Log provider-specific stats
    console.log('AI models update completed.');
    console.log(`Successfully inserted ${insertedCount} models.`);
    console.log('Models inserted by provider:', providerStats);
    
    const providers = Object.keys(providerStats);
    console.log(`Inserted models from ${providers.length} unique providers: ${providers.join(', ')}`);
    
    // Return detailed response
    return new Response(JSON.stringify({ 
      success: true, 
      totalModels: dedupedModels.length,
      insertedModels: insertedCount,
      providerStats,
      providers,
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
