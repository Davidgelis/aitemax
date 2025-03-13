
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  showCount?: boolean;
  maxCount?: number;
  intentDetection?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, description, error, showCount, maxCount, intentDetection, onChange, value, ...props }, ref) => {
    const [currentCount, setCurrentCount] = React.useState<number>(
      typeof value === 'string' ? value.length : 0
    );
    
    // Intent detection patterns to look for in text
    const contentPatterns = [/write/i, /create/i, /draft/i, /article/i, /blog/i, /post/i, /copy/i, /text/i];
    const imagePatterns = [/image/i, /picture/i, /photo/i, /design/i, /draw/i, /graphic/i, /visual/i, /illustration/i];
    const marketingPatterns = [/marketing/i, /campaign/i, /ad/i, /audience/i, /conversion/i, /brand/i, /sell/i, /promote/i];
    const researchPatterns = [/research/i, /analyze/i, /study/i, /investigate/i, /explore/i, /data/i, /findings/i, /report/i];
    
    // Simple intent detection helper
    const detectIntent = (text: string) => {
      // Count pattern matches for each category
      const contentMatches = contentPatterns.filter(pattern => pattern.test(text)).length;
      const imageMatches = imagePatterns.filter(pattern => pattern.test(text)).length;
      const marketingMatches = marketingPatterns.filter(pattern => pattern.test(text)).length;
      const researchMatches = researchPatterns.filter(pattern => pattern.test(text)).length;
      
      // Find the category with the most matches
      const matches = [
        { type: 'content', count: contentMatches },
        { type: 'image', count: imageMatches },
        { type: 'marketing', count: marketingMatches },
        { type: 'research', count: researchMatches }
      ];
      
      const highestMatch = matches.reduce((prev, current) => 
        (current.count > prev.count) ? current : prev
      );
      
      // Only return an intent if we have at least one match
      return highestMatch.count > 0 ? highestMatch.type : null;
    };
    
    // Handle changes for character count and intent detection
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setCurrentCount(newValue.length);
      
      // If intent detection is enabled, analyze the input
      if (intentDetection) {
        const detectedIntent = detectIntent(newValue);
        console.log("Intent detection active, analyzing input...", detectedIntent);
      }
      
      if (onChange) {
        onChange(e);
      }
    };
    
    // Update count when value changes externally
    React.useEffect(() => {
      if (typeof value === 'string') {
        setCurrentCount(value.length);
      }
    }, [value]);
    
    return (
      <div className="space-y-1 w-full">
        {label && <label className="text-sm font-medium">{label}</label>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        
        <div className="relative">
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            onChange={handleChange}
            value={value}
            {...props}
          />
          
          {showCount && maxCount && (
            <div className={cn(
              "absolute bottom-1 right-2 text-xs",
              currentCount > maxCount ? "text-destructive" : "text-muted-foreground"
            )}>
              {currentCount}/{maxCount}
            </div>
          )}
        </div>
        
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
