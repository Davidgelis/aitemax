
import { loadingMessages } from "./constants";

interface LoadingStateProps {
  currentLoadingMessage: number | string;
}

export const LoadingState = ({ currentLoadingMessage }: LoadingStateProps) => {
  // Special case: if the message is related to AI model initialization, 
  // return null instead of showing the loading state
  if (currentLoadingMessage === "Initializing AI models...") {
    return null;
  }
  
  // If we have a string message, display it directly (like the enhance prompt message)
  if (typeof currentLoadingMessage === 'string') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-xl font-medium animate-fade-in">
          {currentLoadingMessage}
        </div>
      </div>
    );
  }
  
  // For numeric indices, use the loadingMessages array
  const safeIndex = Math.min(Math.max(0, currentLoadingMessage), loadingMessages.length - 1);
  const message = loadingMessages[safeIndex];
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-xl font-medium animate-fade-in">
        {message}
      </div>
      <div className="flex gap-2">
        {loadingMessages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === safeIndex ? 'bg-primary scale-125' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
