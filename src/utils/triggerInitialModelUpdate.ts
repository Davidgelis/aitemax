
import { supabase } from '@/integrations/supabase/client';

// This function can be called once to trigger the initial model update
export const triggerInitialModelUpdate = async () => {
  try {
    console.log('Triggering initial AI model update...');
    
    const { data, error } = await supabase.functions.invoke('update-ai-models', {
      method: 'POST',
      headers: {
        'X-Force-Update': 'true'
      }
    });
    
    if (error) {
      console.error('Error triggering model update:', error);
      return { success: false, error };
    }
    
    console.log('Model update successfully triggered:', data);
    return { success: true, data };
  } catch (e) {
    console.error('Exception triggering model update:', e);
    return { success: false, error: e };
  }
};
