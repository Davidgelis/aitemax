
import { loadingMessages } from "./constants";

interface LoadingStateProps {
  currentLoadingMessage: number;
}

export const LoadingState = ({ currentLoadingMessage }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-xl font-medium animate-fade-in">
        {loadingMessages[currentLoadingMessage]}
      </div>
      <div className="flex gap-2">
        {loadingMessages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentLoadingMessage ? 'bg-primary scale-125' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
