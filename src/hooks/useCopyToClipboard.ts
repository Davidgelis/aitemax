
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      toast({
        title: "Copy failed",
        description: "Your browser doesn't support clipboard operations",
        variant: "destructive",
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy: ', error);
      toast({
        title: "Copy failed",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
      return false;
    }
  };

  return { isCopied, copyToClipboard };
};
