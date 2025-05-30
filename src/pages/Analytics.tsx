
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, BarChart3, Users, FileText, FileEdit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Admin user ID
const ADMIN_USER_ID = "8b40d73f-fffb-411f-9044-480773968d58";

interface UserTokenStats {
  user_id: string;
  username: string | null;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_prompt_cost: number;
  total_completion_cost: number;
  total_cost: number;
  prompts_count: number;
  drafts_count: number;
  total_count: number;
}

interface TotalStats {
  total_users: number;
  total_prompts: number;
  total_drafts: number;
  total_all_prompts: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost: number;
  avg_cost_per_prompt: number;
  avg_tokens_per_prompt: number;
}

// Define the type for the RPC response
interface PromptCountResult {
  user_id: string;
  prompts_count: number;
  drafts_count: number;
  total_count: number;
  total_cost: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserTokenStats[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check if current user is admin
  const isAdmin = user?.id === ADMIN_USER_ID;

  // Function to retry fetching data
  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    toast({
      title: "Retrying",
      description: "Attempting to fetch analytics data again...",
    });
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const fetchTokenStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching analytics data, attempt:", retryCount + 1);
        
        // Get user token usage with username
        const { data: userData, error: userError } = await supabase
          .from('user_token_summary')
          .select(`
            user_id,
            total_prompt_tokens,
            total_completion_tokens,
            total_prompt_cost,
            total_completion_cost,
            total_cost
          `);

        if (userError) throw userError;

        // Call the edge function to get accurate prompt counts
        const { data: promptData, error: promptError } = await supabase.functions.invoke(
          'get-prompt-counts-per-user',
          { method: 'POST' }
        );
          
        if (promptError) throw promptError;
        
        console.log("Edge function prompt count result:", promptData);
        
        // Get usernames from profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username');

        if (profilesError) throw profilesError;

        // Create a map of user_id to username
        const usernameMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string | null>);

        // Combine the data
        const combinedStats = userData.map(user => {
          // Find matching prompt counts from edge function data
          const promptCounts = promptData.find(p => p.user_id === user.user_id) || {
            prompts_count: 0,
            drafts_count: 0,
            total_count: 0,
            total_cost: 0
          };

          return {
            user_id: user.user_id,
            username: usernameMap[user.user_id] || 'Unknown User',
            total_prompt_tokens: user.total_prompt_tokens || 0,
            total_completion_tokens: user.total_completion_tokens || 0,
            total_prompt_cost: Number(user.total_prompt_cost) || 0,
            total_completion_cost: Number(user.total_completion_cost) || 0,
            total_cost: Number(user.total_cost) || 0,
            prompts_count: promptCounts.prompts_count || 0,
            drafts_count: promptCounts.drafts_count || 0,
            total_count: promptCounts.total_count || 0
          };
        });

        setUserStats(combinedStats);

        // Calculate total statistics
        const totals: TotalStats = {
          total_users: combinedStats.length,
          total_prompts: combinedStats.reduce((sum, user) => sum + user.prompts_count, 0),
          total_drafts: combinedStats.reduce((sum, user) => sum + user.drafts_count, 0),
          total_all_prompts: combinedStats.reduce((sum, user) => sum + user.total_count, 0),
          total_prompt_tokens: combinedStats.reduce((sum, user) => sum + user.total_prompt_tokens, 0),
          total_completion_tokens: combinedStats.reduce((sum, user) => sum + user.total_completion_tokens, 0),
          total_tokens: combinedStats.reduce((sum, user) => sum + user.total_prompt_tokens + user.total_completion_tokens, 0),
          total_cost: combinedStats.reduce((sum, user) => sum + user.total_cost, 0),
          avg_cost_per_prompt: 0,
          avg_tokens_per_prompt: 0
        };

        // Calculate averages
        if (totals.total_all_prompts > 0) {
          totals.avg_cost_per_prompt = totals.total_cost / totals.total_all_prompts;
          totals.avg_tokens_per_prompt = totals.total_tokens / totals.total_all_prompts;
        }

        setTotalStats(totals);
        setError(null);
        
        // Toast success message on retry success
        if (retryCount > 0) {
          toast({
            title: "Success",
            description: "Analytics data loaded successfully!",
          });
        }
        
      } catch (err) {
        console.error("Error fetching token stats:", err);
        setError("Failed to load analytics data. Please try again.");
        
        // Create dummy data for display
        if (retryCount > 2) {
          console.log("Creating fallback data after multiple retries");
          createFallbackData();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenStats();
  }, [user, isAdmin, retryCount, toast]);

  // Create fallback data if multiple retries fail
  const createFallbackData = () => {
    // Sample user stats with updated pricing
    const sampleUserStats: UserTokenStats[] = [
      {
        user_id: "sample-user-1",
        username: "Sample User 1",
        total_prompt_tokens: 5000,
        total_completion_tokens: 2500,
        total_prompt_cost: 5000 * 0.0025 / 1000, // Updated pricing
        total_completion_cost: 2500 * 0.01 / 1000, // Updated pricing
        total_cost: (5000 * 0.0025 / 1000) + (2500 * 0.01 / 1000), // Updated pricing
        prompts_count: 20,
        drafts_count: 5,
        total_count: 25
      },
      {
        user_id: "sample-user-2",
        username: "Sample User 2",
        total_prompt_tokens: 3000,
        total_completion_tokens: 1500,
        total_prompt_cost: 3000 * 0.0025 / 1000, // Updated pricing
        total_completion_cost: 1500 * 0.01 / 1000, // Updated pricing
        total_cost: (3000 * 0.0025 / 1000) + (1500 * 0.01 / 1000), // Updated pricing
        prompts_count: 10,
        drafts_count: 5,
        total_count: 15
      }
    ];
    
    setUserStats(sampleUserStats);
    
    // Calculate totals
    const totals: TotalStats = {
      total_users: sampleUserStats.length,
      total_prompts: sampleUserStats.reduce((sum, user) => sum + user.prompts_count, 0),
      total_drafts: sampleUserStats.reduce((sum, user) => sum + user.drafts_count, 0),
      total_all_prompts: sampleUserStats.reduce((sum, user) => sum + user.total_count, 0),
      total_prompt_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_prompt_tokens, 0),
      total_completion_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_completion_tokens, 0),
      total_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_prompt_tokens + user.total_completion_tokens, 0),
      total_cost: sampleUserStats.reduce((sum, user) => sum + user.total_cost, 0),
      avg_cost_per_prompt: 0,
      avg_tokens_per_prompt: 0
    };
    
    // Calculate averages
    if (totals.total_all_prompts > 0) {
      totals.avg_cost_per_prompt = totals.total_cost / totals.total_all_prompts;
      totals.avg_tokens_per_prompt = totals.total_tokens / totals.total_all_prompts;
    }
    
    setTotalStats(totals);
    toast({
      title: "Using Sample Data",
      description: "Displaying sample analytics data for preview purposes.",
    });
  };

  // Redirect non-admin users
  if (user && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect not logged-in users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="aurora-button"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
        </div>
        <BarChart3 className="h-8 w-8 text-[#084b49]" />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryFetch}
              className="ml-4 bg-white hover:bg-gray-100"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg border-[#084b49]/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard 
            title="Total Users" 
            value={totalStats?.total_users || 0} 
            icon={<Users className="h-5 w-5" />} 
          />
          <StatsCard 
            title="Completed Prompts" 
            value={totalStats?.total_prompts || 0} 
            icon={<FileText className="h-5 w-5" />} 
          />
          <StatsCard 
            title="Drafts" 
            value={totalStats?.total_drafts || 0} 
            icon={<FileEdit className="h-5 w-5" />} 
          />
          <StatsCard 
            title="Total Prompts" 
            value={totalStats?.total_all_prompts || 0} 
            icon={<BarChart3 className="h-5 w-5" />} 
          />
          <StatsCard 
            title="Total Cost" 
            value={`$${(totalStats?.total_cost || 0).toFixed(4)}`} 
            icon={<CurrencyIcon className="h-5 w-5" />} 
          />
          <StatsCard 
            title="Avg. Cost/Prompt" 
            value={`$${(totalStats?.avg_cost_per_prompt || 0).toFixed(6)}`} 
            icon={<AvgCostIcon className="h-5 w-5" />} 
          />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Usage Breakdown</h2>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Total Tokens:</span> {loading ? (
              <Skeleton className="h-4 w-16 inline-block align-middle ml-1" />
            ) : (
              <span>{totalStats?.total_tokens.toLocaleString()}</span>
            )}
          </div>
        </div>

        {loading ? (
          <Card className="shadow-md">
            <div className="p-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </Card>
        ) : (
          <Card className="shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafafa] border-b">
                    <th className="text-left p-4">User</th>
                    <th className="text-right p-4">Completed</th>
                    <th className="text-right p-4">Drafts</th>
                    <th className="text-right p-4">Total</th>
                    <th className="text-right p-4">Prompt Tokens</th>
                    <th className="text-right p-4">Completion Tokens</th>
                    <th className="text-right p-4">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((stat) => (
                    <tr key={stat.user_id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{stat.username}</td>
                      <td className="p-4 text-right">{stat.prompts_count}</td>
                      <td className="p-4 text-right">{stat.drafts_count}</td>
                      <td className="p-4 text-right">{stat.total_count}</td>
                      <td className="p-4 text-right">{stat.total_prompt_tokens.toLocaleString()}</td>
                      <td className="p-4 text-right">{stat.total_completion_tokens.toLocaleString()}</td>
                      <td className="p-4 text-right">${stat.total_cost.toFixed(4)}</td>
                    </tr>
                  ))}
                  
                  {userStats.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No usage data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper components
const StatsCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <Card className="shadow-lg border-[#084b49]/20 transition-all hover:shadow-[0_0_10px_rgba(51,254,166,0.2)]">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-[#084b49]">{icon}</div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const CurrencyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 18V6" />
  </svg>
);

const AvgCostIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);
