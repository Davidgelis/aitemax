
import { Lightbulb, Star, Target, Zap } from "lucide-react";

interface SuggestionsSectionProps {
  finalPrompt: string;
  variables: any[];
}

export const SuggestionsSection = ({
  finalPrompt,
  variables
}: SuggestionsSectionProps) => {
  // Generate suggestions based on the prompt content
  const generateSuggestions = () => {
    const suggestions = [];
    
    // Basic suggestions that always apply
    suggestions.push({
      icon: Star,
      title: "Add specific examples",
      description: "Consider adding concrete examples to make your prompt more clear and actionable."
    });
    
    suggestions.push({
      icon: Target,
      title: "Define your target audience",
      description: "Specify who the output is intended for to get more targeted results."
    });
    
    // Conditional suggestions based on prompt content
    if (finalPrompt.length < 100) {
      suggestions.push({
        icon: Zap,
        title: "Expand your prompt",
        description: "Your prompt is quite short. Consider adding more context or specific requirements."
      });
    }
    
    if (!finalPrompt.toLowerCase().includes("format") && !finalPrompt.toLowerCase().includes("structure")) {
      suggestions.push({
        icon: Lightbulb,
        title: "Specify output format",
        description: "Define how you want the response formatted (bullet points, paragraphs, lists, etc.)."
      });
    }
    
    if (variables.length > 0) {
      suggestions.push({
        icon: Target,
        title: "Review your variables",
        description: "Make sure all variables are filled with relevant information for best results."
      });
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const suggestions = generateSuggestions();

  return (
    <div className="mb-4 p-3 border rounded-lg bg-background/50">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        Suggestions & Recommendations
      </h4>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex gap-3 items-start p-3 rounded-md bg-white/50 border border-gray-100">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50">
              <suggestion.icon className="w-3 h-3 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-900 mb-1">
                {suggestion.title}
              </h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                {suggestion.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200">
        <div className="flex gap-2 items-start">
          <Star className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-800 mb-1">Pro Tip</p>
            <p className="text-xs text-green-700">
              The more specific and detailed your prompt, the better the AI can understand and fulfill your request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
