
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
    
    // Handle changes for character count and intent detection
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setCurrentCount(newValue.length);
      
      // If intent detection is enabled, we can add additional logic here
      // to detect patterns that suggest certain types of content needs
      if (intentDetection) {
        // This is a placeholder for future intent detection enhancements
        console.log("Intent detection active, analyzing input...");
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
