
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the Supabase Edge Function to update AI models
    const { data, error } = await supabase.functions.invoke('update-ai-models', {
      method: 'POST',
      body: {},
    });

    if (error) {
      console.error('Error invoking update-ai-models function:', error);
      return res.status(500).json({ error: 'Failed to update AI models' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating AI models:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
