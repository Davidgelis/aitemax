
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    variant?: "default" | "primary" | "secondary" | "aurora"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-primary data-[state=checked]:bg-opacity-100 data-[state=unchecked]:bg-opacity-15",
    primary: "bg-[#33fea6] data-[state=checked]:bg-opacity-100 data-[state=unchecked]:bg-opacity-15",
    secondary: "bg-[#084b49] data-[state=checked]:bg-opacity-100 data-[state=unchecked]:bg-opacity-15",
    aurora: "bg-white border-gray-200" // White background for the switch
  }

  // Ensure the variant is valid, defaulting to "default" if not
  const safeVariant = (variant && variantStyles[variant]) ? variant : "default";

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[safeVariant],
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full shadow-lg shadow-[rgba(0,0,0,0.3)] ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          "bg-white"
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
