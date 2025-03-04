
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced AI model data with a wider variety of models from major providers
// Each model has detailed strengths and limitations
const aiModels = [
  // OpenAI Models
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model combining vision and language capabilities with superior performance across text, vision, and reasoning tasks.",
    strengths: [
      "Exceptional multimodal capabilities for processing images and text together",
      "Significantly improved reasoning and problem-solving compared to previous models",
      "Superior performance in academic benchmarks including math, coding, and reasoning",
      "Enhanced instruction following with better alignment to user intent",
      "Improved factual accuracy and reduced hallucinations compared to GPT-4",
      "Faster processing speed and lower latency than the original GPT-4"
    ],
    limitations: [
      "May still produce convincing but incorrect information despite improvements",
      "Limited by knowledge cutoff date, limiting awareness of recent events",
      "Cannot browse the internet or access external tools without explicit integration",
      "Vision capabilities have limits in detailed image analysis or specialized domains",
      "May struggle with extremely complex multi-step reasoning chains",
      "Higher cost compared to smaller models, limiting some applications"
    ]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A smaller, faster, and more cost-effective version of GPT-4o that maintains strong performance across general tasks with multimodal capabilities.",
    strengths: [
      "Significantly faster response times than full-sized GPT-4o",
      "Much lower cost per token making it viable for high-volume applications",
      "Good balance of performance and efficiency for most everyday tasks",
      "Maintains core multimodal capabilities for basic image understanding",
      "Improved instruction following compared to previous generation smaller models",
      "Suitable for real-time applications requiring low latency"
    ],
    limitations: [
      "Noticeably reduced reasoning capabilities on complex tasks compared to GPT-4o",
      "Less robust knowledge in specialized academic and professional domains",
      "More limited ability to handle multi-step instructions in a single prompt",
      "Reduced context window limiting analysis of longer documents",
      "Higher tendency to hallucinate or produce inaccuracies under uncertainty",
      "Less advanced image understanding for complex visual scenes or technical visuals"
    ]
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "OpenAI's efficient and cost-effective language model for most everyday tasks, offering a good balance between performance and resource requirements.",
    strengths: [
      "Very fast response times with low latency even under high load",
      "Significantly lower cost compared to GPT-4 models, enabling broader applications",
      "Good general capabilities across a wide range of common tasks",
      "Widely supported with extensive documentation and community resources",
      "Strong performance in conversational contexts and simple writing tasks",
      "Well-tested in production environments with predictable behavior"
    ],
    limitations: [
      "Substantially less capable on complex reasoning tasks than GPT-4 series",
      "Limited mathematical reasoning and problem-solving abilities",
      "Higher tendency to produce hallucinations or inaccuracies",
      "Less effective at following detailed multi-step instructions",
      "More prone to misunderstanding nuanced or ambiguous requests",
      "Knowledge cutoff limits awareness of recent events and developments"
    ]
  },
  {
    name: "DALL-E 3",
    provider: "OpenAI",
    description: "OpenAI's advanced text-to-image model that can generate detailed and creative images from natural language descriptions.",
    strengths: [
      "Exceptional ability to generate photorealistic images from text descriptions",
      "Strong understanding of complex spatial relationships and object compositions",
      "Ability to follow detailed style instructions for consistent artistic renderings",
      "Good handling of abstract concepts and creative interpretations",
      "Improved handling of text within images compared to previous generations",
      "Better understanding of human figures and anatomical proportions"
    ],
    limitations: [
      "Occasional misinterpretation of complex prompts with multiple constraints",
      "Limited ability to generate certain restricted content categories",
      "Inconsistent quality for highly technical or specialized domain imagery",
      "May struggle with very specific brand elements or copyrighted characters",
      "Limited control over fine details compared to professional design tools",
      "Higher cost per image compared to smaller image generation models"
    ]
  },
  
  // Anthropic Models
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's flagship model with state-of-the-art reasoning capabilities and exceptional performance across academic and professional tasks.",
    strengths: [
      "Industry-leading performance on reasoning tasks requiring careful, multi-step analysis",
      "Exceptional code generation and debugging capabilities with attention to detail",
      "Significantly reduced tendency to hallucinate compared to many competitors",
      "Excellent at following detailed instructions with high precision",
      "Strong performance in specialized professional domains like law and medicine",
      "Consistent outputs across multiple attempts at the same query"
    ],
    limitations: [
      "Higher latency and computational requirements than smaller models in the Claude family",
      "Less widespread availability and integration with third-party platforms than some competitors",
      "Limited context window compared to specialized long-context models",
      "May occasionally be overly cautious when addressing sensitive topics",
      "Vision capabilities not as advanced as specialized vision-language models",
      "Higher cost per token compared to smaller models in the Claude family"
    ]
  },
  {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "A balanced model from Anthropic offering strong performance with improved efficiency, positioned between Haiku and Opus for general applications.",
    strengths: [
      "Excellent instruction following with high precision and attention to detail",
      "Good balance of quality and speed for most business applications",
      "Significantly reduced hallucination rate compared to industry average",
      "Strong reasoning capabilities for business and analytical tasks",
      "Consistent and predictable outputs across repeated queries",
      "Better handling of nuance in complex conversations than smaller models"
    ],
    limitations: [
      "Not as powerful as Claude 3 Opus for specialized expert tasks",
      "Limited knowledge cutoff date, missing recent information",
      "May struggle with complex multi-step reasoning in specialized domains",
      "More limited mathematical reasoning compared to Opus",
      "Less advanced coding capabilities than specialized coding models",
      "More restricted context window than the larger Gemini or Claude models"
    ]
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Anthropic's fastest and most compact model, designed for low-latency applications requiring quick responses while maintaining good accuracy.",
    strengths: [
      "Extremely fast response times suitable for real-time applications",
      "Low cost making it viable for high-volume consumer applications",
      "Good for real-time chat interfaces requiring immediate feedback",
      "Maintains reasonable accuracy on many common tasks despite small size",
      "Effective for straightforward content generation and moderation",
      "Suitable for mobile and edge deployments with limited resources"
    ],
    limitations: [
      "Significantly reduced capabilities compared to larger Claude models",
      "Limited context window restricting analysis of longer documents",
      "Less effective for complex reasoning or specialized knowledge domains",
      "Higher error rate in mathematical calculations and logical reasoning",
      "More prone to misunderstanding complex or nuanced instructions",
      "Limited ability to maintain context across very long conversations"
    ]
  },
  {
    name: "Claude 2",
    provider: "Anthropic",
    description: "Anthropic's previous generation large language model that balances performance, reliability and efficiency.",
    strengths: [
      "Strong instruction following capabilities for everyday tasks",
      "Good balance of reasoning ability and response speed",
      "Extensive testing and reliability in production environments",
      "Well-documented behavior patterns for developers",
      "Better at avoiding harmful content than many earlier models",
      "Good multi-turn conversation maintaining context"
    ],
    limitations: [
      "Significantly less capable than Claude 3 series across most tasks",
      "More limited knowledge base with earlier cutoff date",
      "Higher hallucination rate than newer Claude models",
      "Less effective at handling complex, multi-step instructions",
      "More limited coding and mathematical abilities",
      "Lacks multimodal capabilities of newer models"
    ]
  },
  
  // Google Models
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model featuring an exceptionally large context window and improved reasoning capabilities across diverse tasks.",
    strengths: [
      "Massive 1 million token context window, industry-leading for analyzing long documents",
      "Sophisticated multimodal understanding across text, images, audio, and video",
      "Strong reasoning capabilities particularly for scientific and technical content",
      "Excellent at maintaining coherence across very long conversations",
      "Efficient processing despite the large context window size",
      "Well-optimized for Google's ecosystem and cloud infrastructure"
    ],
    limitations: [
      "May struggle with certain specialized domains outside its training focus",
      "Potential for generating plausible but incorrect information in areas of uncertainty",
      "Less widely tested in production settings than some competitor models",
      "Higher computational requirements when utilizing the full context window",
      "More limited third-party integrations compared to OpenAI's ecosystem",
      "API access restrictions and availability limitations in certain regions"
    ]
  },
  {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    description: "A faster, more efficient version of Google's Gemini 1.5 model designed for high-throughput applications where speed is critical.",
    strengths: [
      "Very fast inference speed suitable for real-time interactive applications",
      "Retains large context window capabilities with efficient processing",
      "Good balance of performance and cost for everyday applications",
      "Maintains core multimodal capabilities with good efficiency",
      "Works well for content generation and analysis at scale",
      "Lower latency for time-sensitive applications"
    ],
    limitations: [
      "Reduced reasoning capabilities compared to Gemini 1.5 Pro",
      "Less adept at solving complex problems requiring deep analysis",
      "May produce more superficial responses to complex queries",
      "Less effective for specialized academic or scientific tasks",
      "Reduced performance on advanced coding and mathematics",
      "More limited handling of ambiguity and nuance in responses"
    ]
  },
  {
    name: "Gemini 1.0 Ultra",
    provider: "Google",
    description: "Google's previous generation flagship model with strong performance across language understanding, reasoning, and knowledge tasks.",
    strengths: [
      "Robust performance across a wide range of general knowledge tasks",
      "Good reasoning capabilities for analytical problems",
      "Strong performance on coding tasks with context understanding",
      "Effective at summarization and content generation",
      "Well-tested in various production environments",
      "Reliable behavior patterns for developers"
    ],
    limitations: [
      "Significantly smaller context window than Gemini 1.5 series",
      "More limited multimodal capabilities than newer models",
      "Less effective at maintaining coherence in very long conversations",
      "More likely to produce hallucinations than newer models",
      "Knowledge cutoff date restricts awareness of recent events",
      "Less capable on complex multi-step reasoning tasks"
    ]
  },
  {
    name: "PaLM 2",
    provider: "Google",
    description: "Google's large language model with strong multilingual capabilities and reasoning abilities across a variety of domains.",
    strengths: [
      "Excellent multilingual capabilities across hundreds of languages",
      "Strong performance on translation and cross-lingual tasks",
      "Good reasoning abilities for general knowledge domains",
      "Well-optimized for Google Cloud and Vertex AI deployment",
      "Reliable performance for enterprise applications",
      "Extensive testing for bias and safety"
    ],
    limitations: [
      "Superseded by Gemini models for most new applications",
      "More limited context window compared to newer models",
      "Less capable on complex reasoning tasks than Gemini series",
      "No multimodal capabilities for processing images or audio",
      "Earlier knowledge cutoff date with more outdated information",
      "Higher latency and resource requirements than specialized models"
    ]
  },
  
  // Meta Models
  {
    name: "Llama 3 8B",
    provider: "Meta",
    description: "The smallest variant of Meta's Llama 3 family, optimized for efficiency while maintaining good language understanding capabilities.",
    strengths: [
      "Extremely efficient with low hardware requirements",
      "Fast inference speed suitable for real-time applications",
      "Can run on consumer hardware including some mobile devices",
      "Good performance-to-size ratio for general tasks",
      "Open weights enabling extensive customization and fine-tuning",
      "Low deployment cost for high-volume applications"
    ],
    limitations: [
      "Limited reasoning capabilities compared to larger models",
      "Struggles with complex multi-step instructions",
      "Less effective for specialized knowledge domains",
      "More prone to hallucinations and factual errors",
      "Reduced context window limiting document analysis",
      "Less capable at nuanced understanding of ambiguous queries"
    ]
  },
  {
    name: "Llama 3 70B",
    provider: "Meta",
    description: "The largest variant of Meta's Llama 3 family with strong overall performance approaching commercial closed-source models in many benchmarks.",
    strengths: [
      "Strong performance across a wide range of tasks approaching proprietary models",
      "Open weights enabling research transparency and customization",
      "Good instruction following with improved alignment over previous generations",
      "Competitive with many closed models at a lower deployment cost",
      "Can be fine-tuned for specific domains with relatively modest resources",
      "Growing ecosystem of optimizations and deployment solutions"
    ],
    limitations: [
      "High hardware requirements for efficient inference (minimum 40GB VRAM)",
      "Less overall training data compared to leading proprietary alternatives",
      "May lag behind top commercial alternatives in specialized domains",
      "More challenging to deploy and maintain than API-based solutions",
      "Limited built-in safety measures compared to heavily aligned models",
      "Less integrated developer tooling and documentation than major platforms"
    ]
  },
  {
    name: "Llama 3 405B",
    provider: "Meta",
    description: "Meta's largest language model with significantly improved reasoning and instruction following capabilities over previous generations.",
    strengths: [
      "Superior reasoning capabilities approaching top commercial models",
      "Excellent performance on complex coding and mathematical tasks",
      "Strong ability to follow nuanced multi-step instructions",
      "Improved factual accuracy and reduced hallucinations",
      "Better handling of ambiguity and context understanding",
      "Open architecture enabling research and customization"
    ],
    limitations: [
      "Extreme hardware requirements limiting widespread deployment",
      "Significantly higher computational cost than smaller Llama variants",
      "Challenging to fine-tune without substantial compute resources",
      "More complex deployment and optimization requirements",
      "Limited available deployment solutions due to size constraints",
      "Less tested in production environments than smaller variants"
    ]
  },
  {
    name: "Llama 2 70B",
    provider: "Meta",
    description: "Meta's previous generation large language model that offers a good balance of performance and resource requirements.",
    strengths: [
      "Well-established model with extensive community support",
      "Strong performance on general language tasks",
      "Good instruction following capabilities",
      "Open weights enabling customization and research",
      "Extensive ecosystem of optimization tools and deployments",
      "Well-documented behavior for developers"
    ],
    limitations: [
      "Significantly less capable than Llama 3 on reasoning tasks",
      "More limited context window than newer models",
      "Higher tendency to hallucinate or produce inaccuracies",
      "Less effective instruction following than Llama 3 series",
      "Limited by earlier training data and knowledge cutoff",
      "Requires careful prompting for complex tasks"
    ]
  },
  
  // Mistral AI Models
  {
    name: "Mistral Large",
    provider: "Mistral AI",
    description: "Mistral AI's flagship model, optimized for performance and versatility with particular strengths in reasoning and structured outputs.",
    strengths: [
      "Exceptional performance on reasoning tasks relative to model size",
      "Strong instruction following capabilities with high precision",
      "Competitive with much larger models on many benchmarks",
      "Efficient architecture enabling faster inference than comparable models",
      "Good at generating structured outputs like JSON and XML",
      "Strong multilingual capabilities across major European languages"
    ],
    limitations: [
      "Less established track record in production compared to models from larger companies",
      "Limited training data compared to the largest models from OpenAI and Anthropic",
      "Smaller developer ecosystem and fewer integration examples",
      "Less documented behavior in edge cases and specialized domains",
      "Limited context window compared to some competitor models",
      "Less extensive safety testing and alignment compared to more established providers"
    ]
  },
  {
    name: "Mistral Small",
    provider: "Mistral AI",
    description: "A compact and efficient model from Mistral AI optimized for everyday tasks with a good balance of performance and cost.",
    strengths: [
      "Fast inference speed suitable for interactive applications",
      "Good performance-to-size ratio for general tasks",
      "Reliable instruction following for straightforward requests",
      "Efficient architecture requiring modest computational resources",
      "Suitable for deployment in resource-constrained environments",
      "Good multilingual capabilities for major European languages"
    ],
    limitations: [
      "Limited reasoning capabilities for complex problem-solving",
      "Less effective at multi-step instructions than larger models",
      "More prone to factual errors in specialized domains",
      "Reduced context understanding for nuanced or ambiguous queries",
      "Smaller context window limiting document analysis",
      "Less capable at generating highly structured or specific outputs"
    ]
  },
  {
    name: "Mistral Embed",
    provider: "Mistral AI",
    description: "Mistral AI's specialized embedding model designed for text representation, semantic search, and similarity tasks.",
    strengths: [
      "Optimized specifically for high-quality text embeddings",
      "Excellent performance on semantic search and retrieval tasks",
      "Strong language understanding for similarity comparisons",
      "Efficient processing suitable for high-volume embedding generation",
      "Good cross-lingual capabilities for multilingual applications",
      "Compact representations suitable for vector databases"
    ],
    limitations: [
      "Single-purpose model not designed for text generation or chat",
      "Limited to embedding functionality without reasoning capabilities",
      "Not suitable for tasks requiring contextual responses",
      "Requires additional components for complete RAG systems",
      "Less effective for highly specialized domain-specific embeddings without fine-tuning",
      "Not designed for multimodal embedding applications"
    ]
  },
  {
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    description: "Mistral AI's mixture of experts model combining multiple specialized networks for improved performance across diverse tasks.",
    strengths: [
      "Efficient architecture providing strong performance at reasonable cost",
      "Mixture of experts approach specializing in different domains",
      "Good reasoning capabilities compared to similarly sized models",
      "Strong instruction following with good precision",
      "Reliable performance across a wide range of general tasks",
      "Open weights enabling customization and research"
    ],
    limitations: [
      "More complex architecture requiring specialized optimization",
      "Higher memory requirements than standard architectures of similar size",
      "Less widespread deployment solutions than simpler architectures",
      "May exhibit inconsistent performance across different domains",
      "More challenging to fine-tune than standard architectures",
      "Limited context window compared to newer models"
    ]
  },
  
  // Cohere Models
  {
    name: "Command R+",
    provider: "Cohere",
    description: "Cohere's advanced language model designed for enterprise applications with strong reasoning and specialized knowledge capabilities.",
    strengths: [
      "Excellent performance on business and enterprise use cases",
      "Strong reasoning capabilities for analytical tasks",
      "Good at following detailed instructions with precision",
      "Specialized knowledge in business, finance, and legal domains",
      "Reliable output formatting for structured data requirements",
      "Strong multilingual capabilities for global enterprise use"
    ],
    limitations: [
      "Less widely known and tested than models from larger providers",
      "More limited ecosystem of integration examples and documentation",
      "May exhibit uneven performance across different specialized domains",
      "More restricted availability through Cohere's platform only",
      "Limited context window compared to some competitor models",
      "Less transparent about training data and methodology"
    ]
  },
  {
    name: "Command R",
    provider: "Cohere",
    description: "Cohere's general-purpose language model balancing performance and efficiency for a wide range of enterprise applications.",
    strengths: [
      "Good balance of performance and efficiency for everyday tasks",
      "Strong enterprise focus with business-oriented capabilities",
      "Reliable instruction following for standard business queries",
      "Well-optimized for RAG applications with good integration",
      "Consistent performance across common business domains",
      "Good multilingual support for international applications"
    ],
    limitations: [
      "Less capable than Command R+ on complex reasoning tasks",
      "More limited performance on highly specialized domains",
      "Reduced context understanding for nuanced queries",
      "Not designed for multimodal inputs like images or audio",
      "Less advanced code generation capabilities than specialized models",
      "More limited creative capabilities than some competitor models"
    ]
  },
  {
    name: "Embed",
    provider: "Cohere",
    description: "Cohere's specialized embedding model optimized for enterprise search, retrieval, and recommendation systems.",
    strengths: [
      "Industry-leading text embeddings optimized for enterprise search",
      "Excellent performance on similarity and relevance tasks",
      "Specialized versions for different languages and domains",
      "Strong multilingual capabilities with cross-lingual understanding",
      "Optimized for efficient integration with vector databases",
      "Well-documented API with enterprise-grade reliability"
    ],
    limitations: [
      "Single-purpose model focused only on embedding generation",
      "Not designed for text generation or conversational tasks",
      "Requires integration with other components for complete systems",
      "May require domain-specific variants for specialized industries",
      "Less effective for highly technical or niche domains without customization",
      "More limited availability than general-purpose models"
    ]
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process with enhanced and expanded model data');

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

    // Clear existing models before inserting new ones
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

    // Insert models, preventing duplicates based on name and provider
    console.log(`Inserting ${aiModels.length} unique AI models with enhanced details`);
    let insertedCount = 0;
    let errors = [];
    
    // Insert each model one by one to prevent duplicates
    for (const model of aiModels) {
      console.log(`Inserting enhanced model: ${model.name} (${model.provider})`);
      
      // Check if this exact model already exists in the database
      const { data: existingModel, error: checkError } = await supabase
        .from('ai_models')
        .select('id')
        .eq('name', model.name)
        .eq('provider', model.provider)
        .limit(1);
        
      if (checkError) {
        console.error(`Error checking if model ${model.name} exists:`, checkError);
        errors.push({ model: model.name, error: checkError.message });
        continue;
      }
      
      // Skip if model already exists
      if (existingModel && existingModel.length > 0) {
        console.log(`Model ${model.name} (${model.provider}) already exists, skipping.`);
        continue;
      }
      
      // Insert the model
      const { error: insertError } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        });
      
      if (insertError) {
        console.error(`Error inserting model ${model.name}:`, insertError);
        errors.push({ model: model.name, error: insertError.message });
        continue;
      }
      
      insertedCount++;
    }

    console.log(`AI models update completed. Successfully inserted ${insertedCount} of ${aiModels.length} enhanced models.`);
    
    // Return detailed response
    return new Response(JSON.stringify({ 
      success: true, 
      totalModels: aiModels.length,
      insertedModels: insertedCount,
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
