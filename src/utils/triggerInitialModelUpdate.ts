
import { supabase } from '@/integrations/supabase/client';

interface ModelUpdateResponse {
  success: boolean;
  error?: any;
  data?: {
    message?: string;
    success?: boolean;
    totalModels?: number;
    insertedModels?: number;
    skipped?: boolean;
    errors?: Array<{model: string, error: string}>;
    [key: string]: any;
  };
}

// This function can be called to trigger the AI model update
export const triggerInitialModelUpdate = async (): Promise<ModelUpdateResponse> => {
  try {
    console.log('Triggering AI model update with enhanced data...');
    
    // Add a timeout to avoid hanging the UI if the function doesn't respond
    const timeoutPromise = new Promise<ModelUpdateResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Function timed out after 20 seconds')), 20000);
    });
    
    const functionPromise = supabase.functions.invoke('update-ai-models', {
      method: 'POST',
      headers: {
        'X-Force-Update': 'true'
      }
    });
    
    // Use Promise.race to handle potential timeouts
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    if (result.error) {
      console.error('Error from edge function:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('Enhanced model update response:', result.data);
    
    // Check if any errors occurred during insertion
    if (result.data?.errors && result.data.errors.length > 0) {
      console.warn('Some enhanced models failed to insert:', result.data.errors);
    }
    
    return { success: true, data: result.data };
  } catch (e) {
    console.error('Exception triggering enhanced model update:', e);
    
    // Check if models exist despite the error, to avoid repeated failed attempts
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('id')
        .limit(1);
        
      if (!error && data && data.length > 0) {
        console.log('Models already exist despite function error');
        return { success: true, data: { message: 'Models already exist, using existing data' } };
      } else {
        console.log('No models found in database after error');
      }
    } catch (checkError) {
      console.error('Error checking models after function error:', checkError);
    }
    
    return { success: false, error: e };
  }
};
