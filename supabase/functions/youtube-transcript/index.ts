
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
    
    let videoResponse;
    try {
      videoResponse = await fetch(videoDetailsUrl);
    } catch (error) {
      console.error("Network error fetching video details:", error);
      throw new Error('Network error: Unable to connect to YouTube API');
    }
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error(`YouTube API error (${videoResponse.status}):`, errorText);
      
      if (videoResponse.status === 403) {
        throw new Error('YouTube API key error: Please check API key permissions');
      } else {
        throw new Error(`YouTube API error: ${videoResponse.status} ${videoResponse.statusText}`);
      }
    }
    
    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found or has been removed');
    }
    
    const videoDetails = videoData.items[0].snippet;
    console.log(`Successfully fetched details for video: ${videoDetails.title}`);

    // Next, try to get captions info
    const captionsInfoUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    let captionsInfoResponse;
    try {
      captionsInfoResponse = await fetch(captionsInfoUrl);
    } catch (error) {
      console.error("Network error fetching captions info:", error);
      // Just log this error but don't throw - we'll continue with what we have
    }
    
    let captionsInfo = { items: [] };
    let captionsAvailable = false;
    
    if (captionsInfoResponse && captionsInfoResponse.ok) {
      try {
        captionsInfo = await captionsInfoResponse.json();
        captionsAvailable = captionsInfo.items && captionsInfo.items.length > 0;
        console.log(`Captions available: ${captionsAvailable ? 'Yes' : 'No'}`);
      } catch (error) {
        console.error("Error parsing captions response:", error);
      }
    }
    
    // If user specifically asked for captions but none are available
    if (!captionsAvailable && userInstructions.toLowerCase().includes('caption')) {
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
        } else {
          console.log("No sentences matching keywords found in description");
        }
      }
    }
    
    // Try to extract keywords from video tags as well
    let keywordsInfo = "";
    if (videoDetails.tags && videoDetails.tags.length > 0) {
      keywordsInfo = `\n\nVideo keywords: ${videoDetails.tags.join(', ')}`;
      console.log(`Extracted ${videoDetails.tags.length} tags from video`);
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
      hasCaptions: captionsAvailable,
      success: true
    };

    console.log("Successfully processed YouTube metadata with targeted extraction based on user instructions");
    
    return new Response(JSON.stringify(transcriptData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in youtube-transcript function:", error);
    
    // Determine if this is a caption-related error for specific UI handling
    const isCaptionError = error.message && error.message.includes('captions');
    
    return new Response(JSON.stringify({
      error: error.message,
      errorType: isCaptionError ? 'caption_unavailable' : 'general_error',
      success: false
    }), {
      status: 200, // Return 200 to avoid edge function errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
