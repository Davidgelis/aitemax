
import { supabase } from '@/integrations/supabase/client';

interface ModelUpdateResponse {
  data?: {
    message?: string;
    success?: boolean;
    totalModels?: number;
    insertedModels?: number;
    skipped?: boolean;
    [key: string]: any;
  };
  error?: any;
}

// This function can be called once to trigger the initial model update
export const triggerInitialModelUpdate = async () => {
  try {
    console.log('Triggering initial AI model update...');
    
    // Add a timeout to avoid hanging the UI if the function doesn't respond
    const timeoutPromise = new Promise<ModelUpdateResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Function timed out after 15 seconds')), 15000);
    });
    
    const functionPromise = supabase.functions.invoke<ModelUpdateResponse>('update-ai-models', {
      method: 'POST',
      headers: {
        'X-Force-Update': 'true'
      }
    });
    
    // Use Promise.race to handle potential timeouts
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    if (result.error) {
      console.error('Error triggering model update:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('Model update response:', result.data);
    return { success: true, data: result.data };
  } catch (e) {
    console.error('Exception triggering model update:', e);
    
    // Check if models exist despite the error, to avoid repeated failed attempts
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('id')
        .limit(1);
        
      if (!error && data && data.length > 0) {
        console.log('Models already exist despite function error');
        return { success: true, data: { message: 'Models already exist, using existing data' } };
      }
    } catch (checkError) {
      console.error('Error checking models after function error:', checkError);
    }
    
    return { success: false, error: e };
  }
};
