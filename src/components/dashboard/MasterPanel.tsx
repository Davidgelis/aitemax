
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateSelector } from './TemplateSelector';

const MasterPanel = () => {
  return (
    <ScrollArea className="h-screen w-full" hideScrollbar>
      <div className="h-full flex flex-col p-4 space-y-6">
        <TemplateSelector />
        <div className="text-center mt-4">Additional Master Panel Content</div>
      </div>
    </ScrollArea>
  );
};

export default MasterPanel;
