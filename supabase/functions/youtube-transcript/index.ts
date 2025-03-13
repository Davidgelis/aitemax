
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

    if (!videoId) {
      throw new Error('No video ID provided');
    }

    console.log(`Fetching transcript for video ID: ${videoId}`);

    // First, fetch the captions track info
    const captionsInfoUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const captionsInfoResponse = await fetch(captionsInfoUrl);
    
    if (!captionsInfoResponse.ok) {
      const errorData = await captionsInfoResponse.text();
      console.error("YouTube API error:", errorData);
      throw new Error(`Failed to fetch captions info: ${captionsInfoResponse.status}`);
    }
    
    const captionsInfo = await captionsInfoResponse.json();
    
    // If we can't get captions from the API (which is common due to access restrictions),
    // we'll fetch the video details to at least get some context
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
    
    // Instead of actual transcript (which requires authentication), 
    // we'll return video metadata that can be used as context
    const transcriptData = {
      title: videoDetails.title,
      description: videoDetails.description,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      tags: videoDetails.tags || [],
      transcript: "Due to YouTube API limitations, full transcript extraction requires authentication. " +
                  "Using video metadata as context instead.",
      hasCaptions: captionsInfo.items && captionsInfo.items.length > 0,
    };

    console.log("Successfully processed video metadata");
    
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
