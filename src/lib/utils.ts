
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createGradientStyles(colors: string[], direction = '90deg') {
  const colorStops = colors.join(', ');
  return `linear-gradient(${direction}, ${colorStops})`;
}

export function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

export function getTextLines(text: string, maxCharsPerLine: number): number {
  if (!text) return 1;
  
  // Simple estimation of line count based on character count and max chars per line
  return Math.ceil(text.length / maxCharsPerLine);
}

export const shorten = (s = "", words = 3) =>
  s.trim().split(/\s+/).slice(0, words).join(" ");

/**
 * Clamps a string to a maximum character length
 * @param text The text to clamp
 * @param limit The maximum character limit (default: 100)
 * @returns The clamped string
 */
export function clamp(text = "", limit = 100): string {
  text = text.trim().replace(/\s+/g, " ");
  return text.length <= limit ? text : text.slice(0, limit).trimEnd();
}
