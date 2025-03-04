
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ModelUpdateResponse {
  success: boolean;
  error?: any;
  data?: {
    message?: string;
    success?: boolean;
    totalModels?: number;
    insertedModels?: number;
    providerStats?: Record<string, number>;
    providers?: string[];
    skipped?: boolean;
    errors?: Array<{model: string, error: string}>;
    [key: string]: any;
  };
}

// This function can be called to trigger the AI model update
export const triggerInitialModelUpdate = async (forceUpdate = true): Promise<ModelUpdateResponse> => {
  try {
    console.log('Triggering AI model update with diverse models from multiple providers...');
    
    // Show a loading toast
    toast({
      title: "Updating AI Models",
      description: "Fetching the latest AI models from all providers. This may take a moment...",
    });
    
    // Add a timeout to avoid hanging the UI if the function doesn't respond
    const timeoutPromise = new Promise<ModelUpdateResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Function timed out after 40 seconds')), 40000);
    });
    
    const functionPromise = supabase.functions.invoke('update-ai-models', {
      method: 'POST',
      headers: {
        'X-Force-Update': forceUpdate ? 'true' : 'false'
      }
    });
    
    // Use Promise.race to handle potential timeouts
    const result = await Promise.race([functionPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('Error from edge function:', result.error);
      
      toast({
        title: "Error Updating Models",
        description: `Failed to update AI models: ${result.error.message || 'Unknown error'}`,
        variant: "destructive"
      });
      
      return { success: false, error: result.error };
    }
    
    console.log('Model update response:', result.data);
    
    // Show success toast with details
    if (result.data?.skipped) {
      toast({
        title: "Models Already Updated",
        description: "AI models are already up to date. No changes were made.",
      });
    } else {
      const totalModels = result.data?.insertedModels || 0;
      const providers = result.data?.providers || [];
      
      toast({
        title: "AI Models Updated Successfully",
        description: `Added ${totalModels} models from ${providers.length} providers.`,
      });
    }
    
    // Check if any errors occurred during insertion
    if (result.data?.errors && result.data.errors.length > 0) {
      console.warn('Some models failed to insert:', result.data.errors);
      
      toast({
        title: "Some Models Failed",
        description: `${result.data.errors.length} models couldn't be added due to errors.`,
        variant: "destructive"
      });
    }
    
    // Log provider statistics if available
    if (result.data?.providerStats) {
      console.log('Models inserted by provider:', result.data.providerStats);
      const providers = result.data.providers || Object.keys(result.data.providerStats);
      const totalProviders = providers.length;
      console.log(`Successfully inserted models from ${totalProviders} providers: ${providers.join(', ')}`);
    }
    
    return { success: true, data: result.data };
  } catch (e: any) {
    console.error('Exception triggering model update:', e);
    
    toast({
      title: "Error Updating Models",
      description: `Failed to update models: ${e.message || 'Unknown error'}`,
      variant: "destructive"
    });
    
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

// Function to test if the model update is working by checking database
export const testModelFetch = async (): Promise<boolean> => {
  try {
    console.log('Testing if models are properly fetched...');
    
    // Fetch a sample of models to verify they exist
    const { data, error } = await supabase
      .from('ai_models')
      .select('provider, name')
      .limit(50);
    
    if (error) {
      console.error('Error testing model fetch:', error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('No models found in database, update may have failed');
      return false;
    }
    
    // Count models by provider to verify diversity
    const providerCounts: Record<string, number> = {};
    data.forEach(model => {
      const provider = model.provider || 'Unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    console.log(`Found ${data.length} models in database from ${Object.keys(providerCounts).length} providers`);
    console.log('Models by provider:', providerCounts);
    
    // Check if we have a good variety of providers
    const hasGoodVariety = Object.keys(providerCounts).length >= 4;
    
    if (hasGoodVariety) {
      console.log('Model fetch test successful! Found good variety of models');
    } else {
      console.log('Model fetch test warning: Limited provider variety found');
    }
    
    return true;
  } catch (e) {
    console.error('Exception in model fetch test:', e);
    return false;
  }
};
