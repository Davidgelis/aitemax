import { useMediaQuery } from "./use-media-query";

// Re-export for backward compatibility
export { useMediaQuery };

// Keep the existing useIsMobile implementation but use the new hook internally
export function useIsMobile() {
  return useMediaQuery(`(max-width: 767px)`);
}
