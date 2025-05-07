
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const MasterPanel = () => {
  return (
    <ScrollArea className="h-full w-full" hideScrollbar>
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-center">Master Panel Content</div>
      </div>
    </ScrollArea>
  );
};

export default MasterPanel;
