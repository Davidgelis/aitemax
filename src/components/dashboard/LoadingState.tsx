import { loadingMessages } from "./constants";

interface LoadingStateProps {
  currentLoadingMessage: number | string;
}

export const LoadingState = ({ currentLoadingMessage }: LoadingStateProps) => {
  // If currentLoadingMessage is a string, display it directly
  // Otherwise, use it as an index to the loadingMessages array
  const message = typeof currentLoadingMessage === 'string' 
    ? currentLoadingMessage 
    : loadingMessages[Math.min(Math.max(0, currentLoadingMessage), loadingMessages.length - 1)];
  
  // For progress dots, we'll only show them for numeric indexes
  const showProgressDots = typeof currentLoadingMessage === 'number';
  const safeIndex = typeof currentLoadingMessage === 'number' 
    ? Math.min(Math.max(0, currentLoadingMessage), loadingMessages.length - 1) 
    : 0;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-xl font-medium animate-fade-in">
        {message}
      </div>
      {showProgressDots && (
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
      )}
    </div>
  );
};
