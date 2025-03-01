import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "@/components/UserProfile";

const Dashboard = () => {
  // Add the useAuth hook
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate response");
      }

      const data = await res.json();
      setResponse(data.result);
    } catch (error: any) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setResponse("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Add a welcome header with the user's information */}
      <header className="p-4 bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#545454]">
            Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <UserProfile />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <Card className="border-[#545454] border-[1px]">
          <CardHeader>
            <CardTitle className="text-[#545454]">AI Prompt Generator</CardTitle>
            <CardDescription>
              Enter your prompt to generate a response from the AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-[#545454]">
                Prompt
              </Label>
              <Input
                id="prompt"
                placeholder="Enter your prompt here"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="rounded-md"
              />
            </div>
            {response && (
              <div className="space-y-2">
                <Label htmlFor="response" className="text-[#545454]">
                  Response
                </Label>
                <div className="whitespace-pre-line rounded-md border border-gray-200 bg-white p-4 font-mono text-sm">
                  {response}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-[#084b49] hover:bg-[#041524] text-white"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
