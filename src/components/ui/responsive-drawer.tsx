
import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDrawerProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ResponsiveDrawer = ({
  trigger,
  title,
  description,
  children,
  footer,
  className = "",
  open,
  onOpenChange
}: ResponsiveDrawerProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  
  // Handle controlled vs uncontrolled state
  const isOpenState = open !== undefined ? open : isOpen;
  const handleOpenChange = onOpenChange || setIsOpen;
  
  // Handle the drawer content rendering to avoid hydration issues
  useEffect(() => {
    setIsRendered(true);
  }, []);
  
  if (!isRendered) {
    return null;
  }

  return (
    <Drawer open={isOpenState} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent className={`max-h-[85vh] ${className}`}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 py-2 overflow-y-auto max-h-[60vh]">
          {children}
        </div>
        <DrawerFooter className="pt-0">
          {footer || (
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
