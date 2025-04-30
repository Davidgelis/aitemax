
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
