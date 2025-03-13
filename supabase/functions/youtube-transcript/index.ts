
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const YOUTUBE_API_KEY = 'AIzaSyDu2EpNEIdcyVu4MFl4pL7lRCeP0Daou_w';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the videoId from the request URL
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    const userInstructions = url.searchParams.get('instructions') || '';

    if (!videoId) {
      throw new Error('No video ID provided');
    }

    console.log(`Fetching transcript for video ID: ${videoId}`);
    console.log(`User instructions: ${userInstructions}`);

    // First, fetch the video details to get the title and metadata
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const videoResponse = await fetch(videoDetailsUrl);
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video details: ${videoResponse.status}`);
    }
    
    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const videoDetails = videoData.items[0].snippet;

    // Next, try to get captions info
    const captionsInfoUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
    const captionsInfoResponse = await fetch(captionsInfoUrl);
    
    let captionsInfo = { items: [] };
    if (captionsInfoResponse.ok) {
      captionsInfo = await captionsInfoResponse.json();
    }
    
    // If no captions available and we need them, throw a specific error
    if ((!captionsInfo.items || captionsInfo.items.length === 0) && userInstructions.includes('caption')) {
      throw new Error('This video does not have captions available');
    }
    
    // Get more detailed information from the video description
    let relevantInfo = "";
    if (userInstructions) {
      // Extract keywords from user instructions to look for in description
      const keywords = userInstructions.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['what', 'which', 'when', 'where', 'who', 'how', 'from', 'about', 'this', 'that', 'these', 'those', 'with'].includes(word));
      
      if (keywords.length > 0) {
        console.log(`Looking for keywords in video description: ${keywords.join(', ')}`);
        
        // Search for sentences in description that contain the keywords
        const sentences = videoDetails.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        const relevantSentences = sentences.filter(sentence => {
          const lowerSentence = sentence.toLowerCase();
          return keywords.some(keyword => lowerSentence.includes(keyword));
        });
        
        if (relevantSentences.length > 0) {
          relevantInfo = `\n\nRelevant information from video description:\n${relevantSentences.join('. ')}`;
          console.log(`Found ${relevantSentences.length} relevant sentences in description`);
        }
      }
    }
    
    // Try to extract keywords from video tags as well
    let keywordsInfo = "";
    if (videoDetails.tags && videoDetails.tags.length > 0) {
      keywordsInfo = `\n\nVideo keywords: ${videoDetails.tags.join(', ')}`;
    }
    
    // Response with available information
    const transcriptData = {
      title: videoDetails.title,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      description: videoDetails.description,
      userInstructions: userInstructions,
      tags: videoDetails.tags || [],
      transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nDescription: ${videoDetails.description}${relevantInfo}${keywordsInfo}\n\nNote: Due to YouTube API limitations, only metadata is available without direct caption access.`,
      hasCaptions: captionsInfo.items && captionsInfo.items.length > 0,
    };

    console.log("Successfully processed YouTube metadata with targeted extraction based on user instructions");
    
    return new Response(JSON.stringify(transcriptData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in youtube-transcript function:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 200, // Return 200 to avoid edge function errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
