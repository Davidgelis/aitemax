
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const YOUTUBE_API_KEY = 'AIzaSyDu2EpNEIdcyVu4MFl4pL7lRCeP0Daou_w';
const OAUTH_CLIENT_ID = '903657507924-g41pgokn1tng24brsdurnkamo5oumnei.apps.googleusercontent.com';
const OAUTH_CLIENT_SECRET = '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';

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
    
    // Due to YouTube API limitations with direct caption access, we need to use OAuth
    // First, try to get an OAuth token using client credentials
    console.log("Attempting to get OAuth token for caption access");
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl'
      })
    });
    
    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error("OAuth token error:", tokenError);
      
      // Since we can't actually get captions due to API limitations even with OAuth credentials,
      // we'll send back the available metadata with explanation
      const transcriptData = {
        title: videoDetails.title,
        channelTitle: videoDetails.channelTitle,
        publishedAt: videoDetails.publishedAt,
        description: videoDetails.description,
        userInstructions: userInstructions,
        tags: videoDetails.tags || [],
        transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nDescription: ${videoDetails.description}\n\nNote: Due to YouTube API limitations, full caption text cannot be retrieved without user authorization. Only metadata is available.`,
        hasCaptions: true,
        captionLanguage: captionLanguage,
        limitationInfo: "Full transcript access requires user-level OAuth 2.0 authorization which cannot be implemented in an edge function.",
        success: true
      };
      
      console.log("Returning metadata with OAuth limitation info");
      return new Response(JSON.stringify(transcriptData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained OAuth token");
    
    // Now try to download the caption content with the OAuth token
    const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt`;
    
    let captionResponse;
    try {
      console.log(`Downloading caption content from: ${captionUrl}`);
      
      captionResponse = await fetch(captionUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      console.log(`Caption content response status: ${captionResponse.status}`);
      
      if (!captionResponse.ok) {
        const errorText = await captionResponse.text();
        console.error(`YouTube Caption Download API error (${captionResponse.status}):`, errorText);
        
        // Fall back to metadata
        const transcriptData = {
          title: videoDetails.title,
          channelTitle: videoDetails.channelTitle,
          publishedAt: videoDetails.publishedAt,
          description: videoDetails.description,
          userInstructions: userInstructions,
          tags: videoDetails.tags || [],
          transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nDescription: ${videoDetails.description}\n\nNote: Caption download failed: ${captionResponse.status} ${captionResponse.statusText}`,
          hasCaptions: true,
          captionLanguage: captionLanguage,
          limitationInfo: "Caption download failed even with OAuth authentication.",
          success: true
        };
        
        return new Response(JSON.stringify(transcriptData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error("Error downloading captions:", error);
      throw new Error('Unable to download captions: Network error');
    }
    
    // If we get here, we have successfully downloaded the captions
    const captionText = await captionResponse.text();
    console.log("Successfully downloaded captions, processing...");
    
    // Process SRT format to extract just the text
    const processedText = processSrtToPlainText(captionText);
    
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
    
    // Return full transcript data
    const transcriptData = {
      title: videoDetails.title,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      description: videoDetails.description,
      userInstructions: userInstructions,
      tags: videoDetails.tags || [],
      transcript: `Video Title: ${videoDetails.title}\n\nChannel: ${videoDetails.channelTitle}\n\nTranscript:\n${processedText}${relevantInfo}${keywordsInfo}`,
      hasCaptions: true,
      captionLanguage: captionLanguage,
      success: true
    };

    console.log("Successfully processed YouTube transcript with full caption text");
    
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

// Helper function to convert SRT format to plain text
function processSrtToPlainText(srtText) {
  // SRT format has timestamp lines and text lines
  // We only want to keep the text lines
  const lines = srtText.split('\n');
  let plainText = '';
  let isTextLine = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and numeric lines (subtitle numbers)
    if (line === '' || /^\d+$/.test(line)) {
      isTextLine = false;
      continue;
    }
    
    // Skip timestamp lines (they contain --> )
    if (line.includes('-->')) {
      isTextLine = true;
      continue;
    }
    
    // If it's a text line, add it to our result
    if (isTextLine) {
      plainText += line + ' ';
    }
  }
  
  return plainText.trim();
}
