
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    variant?: "default" | "primary" | "secondary" | "aurora"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const getVariantClasses = (variant: string, checked: boolean) => {
    switch(variant) {
      case "primary":
        return checked ? "bg-[#64bf95]" : "bg-gray-200";
      case "secondary":
        return checked ? "bg-[#084b49]" : "bg-gray-200";
      case "aurora":
        return checked ? "bg-[#64bf95]" : "bg-gray-200"; // Updated to #64bf95
      default:
        return checked ? "bg-primary" : "bg-gray-200";
    }
  };
  
  // Get the checked state from props
  const checked = props.checked || false;
  
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        getVariantClasses(variant, checked),
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          "bg-white" // Always white thumb for all variants to match the design
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
