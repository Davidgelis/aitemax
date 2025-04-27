
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface OpenAIModel {
  id: string;
  created: number;
  object: string;
  owned_by: string;
}

export const OpenAIModelsViewer = () => {
  const [models, setModels] = useState<OpenAIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-openai-models');
      
      if (error) throw error;
      
      setModels(data.models);
      console.log('Available OpenAI models:', data.models);
      
      toast({
        title: "Models Retrieved",
        description: `Found ${data.count} available OpenAI models`,
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: "Error",
        description: "Failed to fetch OpenAI models",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">Available OpenAI Models</CardTitle>
          <CardDescription>
            Complete list of models accessible through your OpenAI API key
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={fetchModels}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {models.map((model) => (
            <div 
              key={model.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <h3 className="font-semibold text-lg">{model.id}</h3>
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <p>Owner: {model.owned_by}</p>
                <p>Created: {new Date(model.created * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          
          {models.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No models found. Please check your OpenAI API key configuration.
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Loading available models...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
