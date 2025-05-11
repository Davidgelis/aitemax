// ─────────────────────────────────────────────────────────────
//  Small shared helper utilities used across the analyze‑prompt
//  edge‑function.  *No* external imports to keep the bundle tiny.
// ─────────────────────────────────────────────────────────────

/**
 * Clamp a string to a maximum number of characters (unicode‑safe).
 * Adds an ellipsis ( … ) when the text is truncated.
 */
export function clamp(str: string, max = 100): string {
  if (!str || typeof str !== "string") return "";
  return str.length <= max ? str : str.slice(0, max - 1).trim() + "…";
}

/**
 * Shorten a string to a nice readable preview – tries to keep words intact.
 * Slightly different from `clamp` because it never appends ellipsis when the
 * string is already short enough.
 */
export function shorten(str: string, max = 80): string {
  if (!str || typeof str !== "string" || str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/**  Very naïve token count used by `computeAmbiguity` – good enough.
 *   Counting spaces ≈ tokens, avoids bringing in extra libs. */
export const countTokens = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/g).length;
};

/** Quick hash helper – not cryptographically secure, just for grouping. */
export const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h >>> 0;
};

// Nothing else here – keep file minimal!

// ─────────────────────────────────────────────────────────────

// NOTE:  Other helpers (computeAmbiguity, organiseQuestionsByPillar) live under
//        utils/questionUtils.ts so they can grow independently without pulling
//        everything into this tiny file.


// EOF
