
import * as React from "react";
import { cva } from "class-variance-authority";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function SidebarProvider({
  children,
  defaultOpen = false,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [sidebarWidth, setSidebarWidth] = React.useState(320);

  return (
    <SidebarContext.Provider value={{ open, setOpen, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

const triggerVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "icon",
    },
  }
);

interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SidebarTrigger({
  className,
  variant,
  size,
  ...props
}: SidebarTriggerProps) {
  const { open, setOpen } = useSidebar();

  return (
    <button
      className={cn(triggerVariants({ variant, size }), className)}
      {...props}
      onClick={() => setOpen(!open)}
    >
      {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </button>
  );
}

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}

export function Sidebar({
  children,
  className,
  side = "left",
}: SidebarProps) {
  const { open, sidebarWidth } = useSidebar();
  
  return (
    <aside
      className={cn(
        "fixed h-full z-40 bg-background border-l border-border transition-all duration-300 overflow-hidden",
        {
          "right-0": side === "right",
          "left-0": side === "left",
          "translate-x-full": side === "right" && !open,
          "-translate-x-full": side === "left" && !open,
          "translate-x-0": open,
        },
        className
      )}
      style={{ width: sidebarWidth }}
    >
      {children}
    </aside>
  );
}

interface SidebarHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarHeader({
  children,
  className,
}: SidebarHeaderProps) {
  return (
    <div className={cn("px-4 py-3 border-b", className)}>
      {children}
    </div>
  );
}

interface SidebarContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarContent({
  children,
  className,
}: SidebarContentProps) {
  return (
    <div className={cn("h-full overflow-auto", className)}>
      {children}
    </div>
  );
}

interface SidebarFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarFooter({
  children,
  className,
}: SidebarFooterProps) {
  return (
    <div className={cn("px-4 py-3 border-t mt-auto", className)}>
      {children}
    </div>
  );
}

interface SidebarGroupProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarGroup({
  children,
  className,
}: SidebarGroupProps) {
  return (
    <div className={cn("px-3 py-2", className)}>
      {children}
    </div>
  );
}

interface SidebarGroupLabelProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarGroupLabel({
  children,
  className,
}: SidebarGroupLabelProps) {
  return (
    <div className={cn("mb-2 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </div>
  );
}

interface SidebarGroupContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarGroupContent({
  children,
  className,
}: SidebarGroupContentProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  );
}

interface SidebarMenuProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarMenu({
  children,
  className,
}: SidebarMenuProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {children}
    </nav>
  );
}

interface SidebarMenuItemProps {
  children?: React.ReactNode;
  className?: string;
}

export function SidebarMenuItem({
  children,
  className,
}: SidebarMenuItemProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function SidebarMenuButton({
  children,
  className,
  asChild = false,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? React.Fragment : "button";
  
  return asChild ? (
    <Comp>
      <div className={cn(
        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}>
        {children}
      </div>
    </Comp>
  ) : (
    <Comp
      className={cn(
        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
