
/**
 * Shortens a string to the specified number of words
 * @param s The string to shorten
 * @param words The maximum number of words to keep
 * @returns The shortened string
 */
export const shorten = (s = "", words = 3) =>
  s.trim().split(/\s+/).slice(0, words).join(" ");
