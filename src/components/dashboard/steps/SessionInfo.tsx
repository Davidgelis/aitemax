
import { useSessionControls } from '@/hooks/useSessionControls';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export function SessionInfo() {
  const { timer, aboutToExpire, refreshSession } = useSessionControls();

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${
        aboutToExpire 
          ? "bg-red-50 text-red-700 border-red-200" 
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`}
    >
      <Clock className="h-3 w-3" />
      <span>Session: {timer}</span>
      
      {aboutToExpire && (
        <button 
          onClick={refreshSession} 
          className="ml-1 text-xs underline hover:text-blue-800"
        >
          Refresh
        </button>
      )}
    </Badge>
  );
}
