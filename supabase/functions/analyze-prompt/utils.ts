
/**
 * Shortens a string to the specified number of words
 * @param s The string to shorten
 * @param words The maximum number of words to keep
 * @returns The shortened string
 */
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
