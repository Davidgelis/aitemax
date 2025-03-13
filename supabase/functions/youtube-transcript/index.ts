
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
    console.log(`Using API key: ${YOUTUBE_API_KEY.substring(0, 5)}...`); // Log partial key for debugging

    // First, fetch the video details to get the title and metadata
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    let videoResponse;
    try {
      console.log(`Requesting video details from: ${videoDetailsUrl}`);
      videoResponse = await fetch(videoDetailsUrl);
      console.log(`Video details response status: ${videoResponse.status}`);
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

    // Next, get captions info to retrieve caption ID
    const captionsInfoUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    let captionsInfoResponse;
    try {
      console.log(`Requesting captions info from: ${captionsInfoUrl}`);
      captionsInfoResponse = await fetch(captionsInfoUrl);
      console.log(`Captions info response status: ${captionsInfoResponse.status}`);
    } catch (error) {
      console.error("Network error fetching captions info:", error);
      throw new Error('Network error: Unable to connect to YouTube captions API');
    }
    
    if (!captionsInfoResponse.ok) {
      const errorText = await captionsInfoResponse.text();
      console.error(`YouTube Captions API error (${captionsInfoResponse.status}):`, errorText);
      throw new Error(`YouTube Captions API error: ${captionsInfoResponse.status} ${captionsInfoResponse.statusText}`);
    }
    
    const captionsInfo = await captionsInfoResponse.json();
    const captionsAvailable = captionsInfo.items && captionsInfo.items.length > 0;
    console.log(`Captions available: ${captionsAvailable ? 'Yes' : 'No'}`);
    
    if (!captionsAvailable) {
      if (userInstructions.toLowerCase().includes('caption')) {
        throw new Error('This video does not have captions available');
      }
      
      // Provide metadata only if captions are not available
      const transcriptData = {
        title: videoDetails.title,
        channelTitle: videoDetails.channelTitle,
        publishedAt: videoDetails.publishedAt,
        description: videoDetails.description,
        userInstructions: userInstructions,
        tags: videoDetails.tags || [],
        transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nDescription: ${videoDetails.description}\n\nNote: This video does not have captions available.`,
        hasCaptions: false,
        success: true
      };
      
      return new Response(JSON.stringify(transcriptData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Select the first caption (usually the auto-generated one)
    const captionId = captionsInfo.items[0].id;
    const captionLanguage = captionsInfo.items[0].snippet?.language || 'Unknown';
    console.log(`Selected caption ID: ${captionId} (Language: ${captionLanguage})`);
    
    // Download the actual caption content
    const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&key=${YOUTUBE_API_KEY}`;
    
    let captionResponse;
    try {
      console.log(`Downloading caption content from: ${captionUrl}`);
      
      // The caption endpoint requires OAuth 2.0 authentication, which we can't use in this context
      // This will unfortunately fail with a 401 error due to API limitations
      captionResponse = await fetch(captionUrl);
      console.log(`Caption content response status: ${captionResponse.status}`);
      
      if (!captionResponse.ok) {
        const errorText = await captionResponse.text();
        console.error(`YouTube Caption Download API error (${captionResponse.status}):`, errorText);
        
        // The YouTube Data API doesn't allow downloading captions with just an API key
        // We need to inform the user about this limitation
        throw new Error('Cannot download captions: YouTube API requires OAuth 2.0 authentication.');
      }
    } catch (error) {
      console.error("Error downloading captions:", error);
      throw new Error('Unable to download captions: YouTube API restriction');
    }
    
    // Extract relevant information from description based on user instructions
    let relevantInfo = "";
    if (userInstructions) {
      const keywords = userInstructions.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['what', 'which', 'when', 'where', 'who', 'how', 'from', 'about', 'this', 'that', 'these', 'those', 'with'].includes(word));
      
      if (keywords.length > 0) {
        console.log(`Looking for keywords in video description: ${keywords.join(', ')}`);
        
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
    
    // Since we can't actually get the captions due to API limitations,
    // we'll send back available metadata with explanation
    const transcriptData = {
      title: videoDetails.title,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      description: videoDetails.description,
      userInstructions: userInstructions,
      tags: videoDetails.tags || [],
      transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nDescription: ${videoDetails.description}${relevantInfo}${keywordsInfo}\n\nNote: Due to YouTube API limitations, caption text cannot be retrieved directly. Only metadata is available.`,
      hasCaptions: true,
      captionLanguage: captionLanguage,
      limitationInfo: "YouTube API restrictions prevent direct caption download without OAuth 2.0 authentication.",
      success: true
    };

    console.log("Successfully processed YouTube metadata with targeted extraction based on user instructions");
    
    return new Response(JSON.stringify(transcriptData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in youtube-transcript function:", error);
    
    // Determine if this is a caption-related error for specific UI handling
    const isCaptionError = error.message && (
      error.message.includes('captions') || 
      error.message.includes('caption') ||
      error.message.includes('OAuth')
    );
    
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
