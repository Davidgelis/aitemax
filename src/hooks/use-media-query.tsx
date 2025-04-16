
import { useCallback, useEffect, useMemo, useState } from "react";
import { breakpoints, Breakpoint, mediaQueries } from "./breakpoints";

// Type for media query creation functions
type MediaQueryCreator = 
  | { type: "up" | "down"; breakpoint: Breakpoint }
  | { type: "between"; min: Breakpoint; max: Breakpoint }
  | { type: "custom"; query: string };

export function useMediaQuery(queryInput: MediaQueryCreator | string) {
  // Memoize the query string creation
  const query = useMemo(() => {
    if (typeof queryInput === "string") return queryInput;

    if ("query" in queryInput) return queryInput.query;

    if ("type" in queryInput) {
      if (queryInput.type === "between") {
        return mediaQueries.between(
          breakpoints[queryInput.min],
          breakpoints[queryInput.max]
        );
      }
      return mediaQueries[queryInput.type](breakpoints[queryInput.breakpoint]);
    }

    return "";
  }, [queryInput]);

  const [matches, setMatches] = useState<boolean>(() => {
    // Provide SSR-friendly initial state
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  // Memoize the media query listener
  const mediaQueryListener = useCallback((event: MediaQueryListEvent) => {
    setMatches(event.matches);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Use modern event listener methods
    mediaQuery.addEventListener("change", mediaQueryListener);
    
    return () => {
      mediaQuery.removeEventListener("change", mediaQueryListener);
    };
  }, [query, mediaQueryListener]);

  return matches;
}

// Convenience hooks for common use cases
export function useIsMobile() {
  return useMediaQuery({ type: "down", breakpoint: "md" });
}

export function useIsTablet() {
  return useMediaQuery({
    type: "between",
    min: "md",
    max: "lg",
  });
}

export function useIsDesktop() {
  return useMediaQuery({ type: "up", breakpoint: "lg" });
}

