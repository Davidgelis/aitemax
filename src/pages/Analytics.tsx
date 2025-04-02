
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, BarChart3, Users, FileText, FileEdit, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

// Admin user ID
const ADMIN_USER_ID = "8b40d73f-fffb-411f-9044-480773968d58";

// Model pricing constants
const MODEL_PRICING = {
  'gpt-4o': {
    promptCostPerToken: 0.0025,  // $2.50 per 1000 tokens
    completionCostPerToken: 0.01,  // $10.00 per 1000 tokens
    color: "#10B981" // green-500
  },
  'o3-mini': {
    promptCostPerToken: 0.0011,  // $1.10 per 1000 tokens
    completionCostPerToken: 0.0044, // $4.40 per 1000 tokens
    color: "#6366F1" // indigo-500
  },
  'default': {
    promptCostPerToken: 0.0025,
    completionCostPerToken: 0.01,
    color: "#A3A3A3" // gray-400
  }
};

// Chart colors
const CHART_COLORS = ["#10B981", "#6366F1", "#EC4899", "#F97316", "#8B5CF6", "#A3A3A3"];

interface ModelUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cost: number;
  completion_cost: number;
  total_cost: number;
  usage_count: number;
}

interface UserTokenStats {
  user_id: string;
  username: string | null;
  prompts_count: number;
  drafts_count: number;
  total_count: number;
  total_cost: number;
  model_usage: {
    [modelName: string]: ModelUsage;
  };
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
}

interface TotalStats {
  total_users: number;
  total_prompts: number;
  total_drafts: number;
  total_all_prompts: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost: number;
  avg_cost_per_prompt: number;
  avg_tokens_per_prompt: number;
  model_usage: {
    [modelName: string]: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      prompt_cost: number;
      completion_cost: number;
      total_cost: number;
      usage_count: number;
      percentage: number;
    };
  };
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
  const [activeTab, setActiveTab] = useState("overview");

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

  // Prepare model usage data for charts
  const prepareModelUsageChart = () => {
    if (!totalStats || !totalStats.model_usage) return [];
    
    const data = Object.entries(totalStats.model_usage).map(([model, stats], index) => ({
      name: model,
      value: stats.total_tokens,
      cost: stats.total_cost,
      color: MODEL_PRICING[model]?.color || CHART_COLORS[index % CHART_COLORS.length]
    }));
    
    return data;
  };

  // Prepare cost breakdown data for charts
  const prepareCostBreakdownChart = () => {
    if (!totalStats || !totalStats.model_usage) return [];
    
    const data = Object.entries(totalStats.model_usage).map(([model, stats], index) => ({
      name: model,
      value: stats.total_cost,
      color: MODEL_PRICING[model]?.color || CHART_COLORS[index % CHART_COLORS.length],
      percentage: (stats.total_cost / totalStats.total_cost * 100).toFixed(1)
    }));
    
    return data;
  };

  // Function to export analytics data as CSV
  const exportDataAsCSV = () => {
    if (!userStats || !userStats.length) return;
    
    // Create header row
    let csv = 'Username,Total Prompts,Drafts,Total Usage,Total Tokens,Cost ($)\n';
    
    // Add data rows
    userStats.forEach(user => {
      csv += `${user.username || 'Unknown User'},${user.prompts_count},${user.drafts_count},${user.total_count},${user.total_tokens},${user.total_cost.toFixed(4)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'prompt_analytics.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export Successful",
      description: "Analytics data has been exported as CSV.",
    });
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const fetchTokenStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching analytics data, attempt:", retryCount + 1);
        
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

        // Call the edge function to get detailed usage data
        const { data: userData, error: userError } = await supabase.functions.invoke(
          'get-prompt-counts-per-user',
          { method: 'POST' }
        );
          
        if (userError) throw userError;
        
        console.log("Edge function returned user data:", userData);
        
        if (!userData || !Array.isArray(userData)) {
          throw new Error("Invalid data returned from the server");
        }

        // Process the user data
        const processedUserStats = userData.map(user => ({
          user_id: user.user_id,
          username: usernameMap[user.user_id] || 'Unknown User',
          prompts_count: user.prompts_count || 0,
          drafts_count: user.drafts_count || 0,
          total_count: user.total_count || 0,
          total_cost: Number(user.total_cost) || 0,
          model_usage: user.model_usage || {},
          total_prompt_tokens: user.total_prompt_tokens || 0,
          total_completion_tokens: user.total_completion_tokens || 0,
          total_tokens: user.total_prompt_tokens + user.total_completion_tokens || 0
        }));

        setUserStats(processedUserStats);

        // Calculate total statistics
        const calculatedStats: TotalStats = {
          total_users: processedUserStats.length,
          total_prompts: processedUserStats.reduce((sum, user) => sum + user.prompts_count, 0),
          total_drafts: processedUserStats.reduce((sum, user) => sum + user.drafts_count, 0),
          total_all_prompts: processedUserStats.reduce((sum, user) => sum + user.total_count, 0),
          total_prompt_tokens: processedUserStats.reduce((sum, user) => sum + user.total_prompt_tokens, 0),
          total_completion_tokens: processedUserStats.reduce((sum, user) => sum + user.total_completion_tokens, 0),
          total_tokens: processedUserStats.reduce((sum, user) => sum + (user.total_prompt_tokens + user.total_completion_tokens), 0),
          total_cost: processedUserStats.reduce((sum, user) => sum + user.total_cost, 0),
          avg_cost_per_prompt: 0,
          avg_tokens_per_prompt: 0,
          model_usage: {}
        };

        // Combine model usage data across users
        processedUserStats.forEach(user => {
          if (user.model_usage) {
            Object.entries(user.model_usage).forEach(([model, stats]) => {
              if (!calculatedStats.model_usage[model]) {
                calculatedStats.model_usage[model] = {
                  prompt_tokens: 0,
                  completion_tokens: 0,
                  total_tokens: 0,
                  prompt_cost: 0,
                  completion_cost: 0,
                  total_cost: 0,
                  usage_count: 0,
                  percentage: 0
                };
              }
              
              calculatedStats.model_usage[model].prompt_tokens += stats.prompt_tokens;
              calculatedStats.model_usage[model].completion_tokens += stats.completion_tokens;
              calculatedStats.model_usage[model].total_tokens += stats.total_tokens;
              calculatedStats.model_usage[model].prompt_cost += stats.prompt_cost;
              calculatedStats.model_usage[model].completion_cost += stats.completion_cost;
              calculatedStats.model_usage[model].total_cost += stats.total_cost;
              calculatedStats.model_usage[model].usage_count += stats.usage_count;
            });
          }
        });

        // Calculate percentages for model usage
        if (calculatedStats.total_cost > 0) {
          Object.keys(calculatedStats.model_usage).forEach(model => {
            calculatedStats.model_usage[model].percentage = 
              (calculatedStats.model_usage[model].total_cost / calculatedStats.total_cost) * 100;
          });
        }

        // Calculate averages
        if (calculatedStats.total_all_prompts > 0) {
          calculatedStats.avg_cost_per_prompt = calculatedStats.total_cost / calculatedStats.total_all_prompts;
          calculatedStats.avg_tokens_per_prompt = calculatedStats.total_tokens / calculatedStats.total_all_prompts;
        }

        setTotalStats(calculatedStats);
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
        total_tokens: 7500,
        total_cost: 0.0375, // Updated based on the pricing model
        prompts_count: 20,
        drafts_count: 5,
        total_count: 25,
        model_usage: {
          'gpt-4o': {
            prompt_tokens: 3000,
            completion_tokens: 1500,
            total_tokens: 4500,
            prompt_cost: 0.0075,
            completion_cost: 0.015,
            total_cost: 0.0225,
            usage_count: 15
          },
          'o3-mini': {
            prompt_tokens: 2000,
            completion_tokens: 1000,
            total_tokens: 3000,
            prompt_cost: 0.0022,
            completion_cost: 0.0044,
            total_cost: 0.0066,
            usage_count: 10
          }
        }
      },
      {
        user_id: "sample-user-2",
        username: "Sample User 2",
        total_prompt_tokens: 3000,
        total_completion_tokens: 1500,
        total_tokens: 4500,
        total_cost: 0.0225, // Updated based on the pricing model
        prompts_count: 10,
        drafts_count: 5,
        total_count: 15,
        model_usage: {
          'gpt-4o': {
            prompt_tokens: 2000,
            completion_tokens: 1000,
            total_tokens: 3000,
            prompt_cost: 0.005,
            completion_cost: 0.01,
            total_cost: 0.015,
            usage_count: 8
          },
          'o3-mini': {
            prompt_tokens: 1000,
            completion_tokens: 500,
            total_tokens: 1500,
            prompt_cost: 0.0011,
            completion_cost: 0.0022,
            total_cost: 0.0033,
            usage_count: 7
          }
        }
      }
    ];
    
    setUserStats(sampleUserStats);
    
    // Calculate totals
    const modelUsage = {
      'gpt-4o': {
        prompt_tokens: 5000,
        completion_tokens: 2500,
        total_tokens: 7500,
        prompt_cost: 0.0125,
        completion_cost: 0.025,
        total_cost: 0.0375,
        usage_count: 23,
        percentage: 75
      },
      'o3-mini': {
        prompt_tokens: 3000,
        completion_tokens: 1500,
        total_tokens: 4500,
        prompt_cost: 0.0033,
        completion_cost: 0.0066,
        total_cost: 0.0099,
        usage_count: 17,
        percentage: 25
      }
    };
    
    const totals: TotalStats = {
      total_users: sampleUserStats.length,
      total_prompts: sampleUserStats.reduce((sum, user) => sum + user.prompts_count, 0),
      total_drafts: sampleUserStats.reduce((sum, user) => sum + user.drafts_count, 0),
      total_all_prompts: sampleUserStats.reduce((sum, user) => sum + user.total_count, 0),
      total_prompt_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_prompt_tokens, 0),
      total_completion_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_completion_tokens, 0),
      total_tokens: sampleUserStats.reduce((sum, user) => sum + user.total_tokens, 0),
      total_cost: sampleUserStats.reduce((sum, user) => sum + user.total_cost, 0),
      avg_cost_per_prompt: 0,
      avg_tokens_per_prompt: 0,
      model_usage
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportDataAsCSV}
            className="flex items-center gap-2"
            disabled={loading || !userStats.length}
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
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

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full mb-6"
      >
        <TabsList className="w-full md:w-auto flex justify-start mb-4 bg-white border">
          <TabsTrigger value="overview" className="flex-1 md:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="models" className="flex-1 md:flex-none">Model Usage</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 md:flex-none">User Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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

          {!loading && totalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cost Breakdown Chart */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Cost Distribution by Model</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareCostBreakdownChart()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {prepareCostBreakdownChart().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Token Distribution Chart */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Token Usage by Model</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareModelUsageChart()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                      >
                        {prepareModelUsageChart().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Model Usage Tab */}
        <TabsContent value="models">
          {loading ? (
            <Card className="shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Model Usage Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Usage Count</TableHead>
                      <TableHead className="text-right">Prompt Tokens</TableHead>
                      <TableHead className="text-right">Completion Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead className="text-right">Prompt Cost</TableHead>
                      <TableHead className="text-right">Completion Cost</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalStats && totalStats.model_usage ? (
                      Object.entries(totalStats.model_usage).map(([model, stats]) => (
                        <TableRow key={model}>
                          <TableCell className="font-medium">{model}</TableCell>
                          <TableCell className="text-right">{stats.usage_count}</TableCell>
                          <TableCell className="text-right">{stats.prompt_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{stats.completion_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{stats.total_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${stats.prompt_cost.toFixed(6)}</TableCell>
                          <TableCell className="text-right">${stats.completion_cost.toFixed(6)}</TableCell>
                          <TableCell className="text-right font-medium">${stats.total_cost.toFixed(6)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No model usage data available
                        </TableCell>
                      </TableRow>
                    )}
                    {totalStats && totalStats.model_usage && Object.keys(totalStats.model_usage).length > 0 && (
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">TOTAL</TableCell>
                        <TableCell className="text-right font-bold">
                          {Object.values(totalStats.model_usage).reduce((sum, stat) => sum + stat.usage_count, 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{totalStats.total_prompt_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">{totalStats.total_completion_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">{totalStats.total_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">
                          ${Object.values(totalStats.model_usage).reduce((sum, stat) => sum + stat.prompt_cost, 0).toFixed(6)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${Object.values(totalStats.model_usage).reduce((sum, stat) => sum + stat.completion_cost, 0).toFixed(6)}
                        </TableCell>
                        <TableCell className="text-right font-bold">${totalStats.total_cost.toFixed(6)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!loading && (
            <div className="mt-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Model Pricing Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">GPT-4o</h3>
                      <ul className="space-y-1 text-sm">
                        <li>Input: $2.50 per 1000 tokens ($0.0025 per token)</li>
                        <li>Output: $10.00 per 1000 tokens ($0.01 per token)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">O3-mini</h3>
                      <ul className="space-y-1 text-sm">
                        <li>Input: $1.10 per 1000 tokens ($0.0011 per token)</li>
                        <li>Output: $4.40 per 1000 tokens ($0.0044 per token)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* User Details Tab */}
        <TabsContent value="users">
          {loading ? (
            <Card className="shadow-md">
              <div className="p-4">
                <Skeleton className="h-96 w-full" />
              </div>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Drafts</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Models Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((stat) => (
                        <TableRow key={stat.user_id} className="border-b hover:bg-muted/50">
                          <TableCell className="font-medium">{stat.username}</TableCell>
                          <TableCell className="text-right">{stat.prompts_count}</TableCell>
                          <TableCell className="text-right">{stat.drafts_count}</TableCell>
                          <TableCell className="text-right">{stat.total_count}</TableCell>
                          <TableCell className="text-right">{stat.total_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${stat.total_cost.toFixed(6)}</TableCell>
                          <TableCell className="text-right">
                            {stat.model_usage ? Object.keys(stat.model_usage).join(', ') : 'None'}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {userStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                            No usage data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    {userStats.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell className="font-medium">Total ({userStats.length} users)</TableCell>
                          <TableCell className="text-right">{totalStats?.total_prompts || 0}</TableCell>
                          <TableCell className="text-right">{totalStats?.total_drafts || 0}</TableCell>
                          <TableCell className="text-right">{totalStats?.total_all_prompts || 0}</TableCell>
                          <TableCell className="text-right">{(totalStats?.total_tokens || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">${(totalStats?.total_cost || 0).toFixed(6)}</TableCell>
                          <TableCell className="text-right">
                            {totalStats?.model_usage ? Object.keys(totalStats.model_usage).length : 0} models
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium">{`${payload[0].name}`}</p>
        <p className="text-sm">{`Value: ${payload[0].value.toLocaleString()}`}</p>
        {payload[0].payload.cost !== undefined && (
          <p className="text-sm">{`Cost: $${payload[0].payload.cost.toFixed(6)}`}</p>
        )}
        {payload[0].payload.percentage !== undefined && (
          <p className="text-sm">{`${payload[0].payload.percentage}% of total`}</p>
        )}
      </div>
    );
  }
  return null;
};

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
