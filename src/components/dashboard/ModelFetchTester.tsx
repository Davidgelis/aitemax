
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelService } from '@/services/ModelService';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export const ModelFetchTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [modelCounts, setModelCounts] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModelData = async () => {
    setIsLoading(true);
    try {
      // Get providers
      const providerList = await ModelService.getProviders();
      setProviders(providerList);
      
      // Get model counts by provider
      const counts = await ModelService.getModelCountByProvider();
      setModelCounts(counts);
      
      setLastUpdated(new Date());
      
      toast({
        title: "Model Data Fetched",
        description: `Found ${providerList.length} providers with a total of ${Object.values(counts).reduce((a, b) => a + b, 0)} models`,
      });
    } catch (error) {
      console.error('Error fetching model data:', error);
      toast({
        title: "Error Fetching Data",
        description: "Failed to load model information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerUpdate = async () => {
    setIsRefreshing(true);
    try {
      toast({
        title: "Updating Models",
        description: "Triggering model update from all providers...",
      });
      
      const success = await ModelService.triggerModelUpdate(true);
      
      if (success) {
        // Refresh model data after update
        await fetchModelData();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update models. Check console for errors.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      toast({
        title: "Error",
        description: "An error occurred during the update process",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-[#545454]">AI Model Fetch Status</CardTitle>
        <CardDescription>Test and verify model data is being properly fetched from the database</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-[#545454]">Providers ({providers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {providers.map(provider => (
                  <Badge key={provider} variant="outline" className="bg-[#fafafa] text-[#545454] border-[#084b49]">
                    {provider} ({modelCounts[provider] || 0})
                  </Badge>
                ))}
                
                {providers.length === 0 && (
                  <p className="text-sm text-[#545454] italic">No providers found. Try refreshing model data.</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-[#545454]">Model Distribution</h3>
              {Object.keys(modelCounts).length > 0 ? (
                <ul className="space-y-1">
                  {Object.entries(modelCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([provider, count]) => (
                      <li key={provider} className="text-sm text-[#545454]">
                        <span className="font-medium">{provider}</span>: {count} models
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-[#545454] italic">No model data available</p>
              )}
            </div>
            
            {lastUpdated && (
              <p className="text-xs text-[#545454] mt-4">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={fetchModelData} 
          disabled={isLoading}
          variant="outline"
          className="border-[#084b49] text-[#545454]"
        >
          Check Model Data
        </Button>
        <Button 
          onClick={triggerUpdate}
          disabled={isRefreshing || isLoading} 
          className="bg-[#084b49] hover:bg-[#033332] text-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Models
        </Button>
      </CardFooter>
    </Card>
  );
};
