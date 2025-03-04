
import { supabase } from '@/integrations/supabase/client';

interface ModelUpdateResponse {
  success: boolean;
  error?: any;
  data?: {
    message?: string;
    success?: boolean;
    totalModels?: number;
    insertedModels?: number;
    providerStats?: Record<string, number>;
    skipped?: boolean;
    errors?: Array<{model: string, error: string}>;
    [key: string]: any;
  };
}

// This function can be called to trigger the AI model update
export const triggerInitialModelUpdate = async (): Promise<ModelUpdateResponse> => {
  try {
    console.log('Triggering AI model update with top 5 models per provider...');
    
    // Add a timeout to avoid hanging the UI if the function doesn't respond
    const timeoutPromise = new Promise<ModelUpdateResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Function timed out after 30 seconds')), 30000);
    });
    
    const functionPromise = supabase.functions.invoke('update-ai-models', {
      method: 'POST',
      headers: {
        'X-Force-Update': 'true'
      }
    });
    
    // Use Promise.race to handle potential timeouts
    const result = await Promise.race([functionPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('Error from edge function:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('Model update response:', result.data);
    
    // Check if any errors occurred during insertion
    if (result.data?.errors && result.data.errors.length > 0) {
      console.warn('Some models failed to insert:', result.data.errors);
    }
    
    // Log provider statistics if available
    if (result.data?.providerStats) {
      console.log('Models inserted by provider:', result.data.providerStats);
      const totalProviders = Object.keys(result.data.providerStats).length;
      console.log(`Successfully inserted models from ${totalProviders} providers`);
    }
    
    return { success: true, data: result.data };
  } catch (e: any) {
    console.error('Exception triggering model update:', e);
    
    // Check if models exist despite the error, to avoid repeated failed attempts
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('id, provider')
        .limit(10);
        
      if (!error && data && data.length > 0) {
        const providers = new Set(data.map(model => model.provider));
        console.log(`Models already exist from ${providers.size} providers despite function error`);
        return { 
          success: true, 
          data: { 
            message: 'Models already exist, using existing data',
            providers: Array.from(providers) 
          } 
        };
      } else {
        console.log('No models found in database after error');
      }
    } catch (checkError) {
      console.error('Error checking models after function error:', checkError);
    }
    
    return { success: false, error: e };
  }
};
