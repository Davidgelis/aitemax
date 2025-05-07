
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const MasterPanel = () => {
  return (
    <ScrollArea className="h-full w-full" hideScrollbar>
      <div className="p-4">Master Panel Content</div>
    </ScrollArea>
  );
};

export default MasterPanel;
