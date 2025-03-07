
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createGradientStyles(colors: string[], direction = '90deg') {
  const colorStops = colors.join(', ');
  return `linear-gradient(${direction}, ${colorStops})`;
}
