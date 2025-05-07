
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const MasterPanel = () => {
  return (
    <ScrollArea className="h-screen w-full" hideScrollbar>
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">Master Panel Content</div>
      </div>
    </ScrollArea>
  );
};

export default MasterPanel;
