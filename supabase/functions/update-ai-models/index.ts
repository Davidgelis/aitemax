
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced AI model data with more detailed strengths and limitations
// No duplicates, just one entry per unique model
const aiModels = [
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
    name: "Llama 3",
    provider: "Meta",
    description: "Meta's advanced open-source large language model with significantly improved reasoning and instruction following over previous generations.",
    strengths: [
      "Open-source architecture enabling customization and fine-tuning for specific needs",
      "Strong performance-to-size ratio, particularly in the 70B variant",
      "Extensive community support and ongoing optimization improvements",
      "Multiple size variants to fit different computational constraints",
      "Reduced training data biases compared to earlier Llama versions",
      "Can be deployed locally or on private infrastructure for enhanced privacy"
    ],
    limitations: [
      "Smaller context window than some proprietary models, limiting handling of long documents",
      "Less training data overall compared to leading closed-source models",
      "May require more explicit and detailed prompting for complex tasks",
      "Less optimized for specialized domains without additional fine-tuning",
      "Slower inference speed on consumer hardware compared to optimized commercial APIs",
      "Limited built-in safeguards compared to heavily aligned commercial models"
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
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process with enhanced data');

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
