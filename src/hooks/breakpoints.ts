
// Common breakpoints following Tailwind's default breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Common media query strings
export const mediaQueries = {
  up: (size: number) => `(min-width: ${size}px)`,
  down: (size: number) => `(max-width: ${size - 1}px)`,
  between: (min: number, max: number) => 
    `(min-width: ${min}px) and (max-width: ${max - 1}px)`,
} as const;

