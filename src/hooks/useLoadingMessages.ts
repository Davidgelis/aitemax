
import { useState, useEffect } from "react";
import { loadingMessages } from "@/components/dashboard/constants";

export const useLoadingMessages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState<number | string>(0);

  // Show loading messages while isLoading is true
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      // Set up an interval to rotate through loading messages
      timeout = setTimeout(() => {
        if (typeof currentLoadingMessage === 'number' && currentLoadingMessage < loadingMessages.length - 1) {
          setCurrentLoadingMessage(prev => {
            if (typeof prev === 'number') {
              return prev + 1;
            }
            return 0;
          });
        } else {
          // Loop back to first message if we've reached the end
          setCurrentLoadingMessage(0);
        }
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, currentLoadingMessage]);

  return {
    isLoading,
    setIsLoading,
    currentLoadingMessage,
    setCurrentLoadingMessage
  };
};
