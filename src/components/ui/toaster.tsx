import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  
  // Filter out duplicate image attached toasts
  // Only keep the most recent one with the same title
  const uniqueToasts = toasts.reduce((acc, toast) => {
    // Check if this is an "Image attached" toast
    if (toast.title === "Image attached") {
      // Remove any existing "Image attached" toasts
      const filtered = acc.filter(t => t.title !== "Image attached");
      // Add only this one (the most recent)
      return [...filtered, toast];
    }
    // Keep all other toasts
    return [...acc, toast];
  }, [] as typeof toasts);

  return (
    <ToastProvider>
      {uniqueToasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="border border-[#084b49]/20 group">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="opacity-70 transition-opacity hover:opacity-100" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
