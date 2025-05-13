
import { Question } from "../types.ts";
import { countTokens } from "../utils.ts";

// ─────────────────────────────────────────────────────────────
//  1️⃣  Ambiguity score –   0 (very clear)  →  1 (very vague)
//     Simple heuristic: short prompts are usually more ambiguous.
// ─────────────────────────────────────────────────────────────

export function computeAmbiguity(prompt: string): number {
  if (!prompt) return 1;
  const tokens = countTokens(prompt);
  // <10 words → 0.9 ;   >60 words → 0.1
  const score = 1 - Math.min(1, Math.max(0, (tokens - 10) / 50));
  return Number(score.toFixed(2));
}

// ─────────────────────────────────────────────────────────────
// 2️⃣  Re‑order / cap questions per pillar so UI never floods.
//     Very lightweight – no fancy NLP, just groups by category.
// ─────────────────────────────────────────────────────────────

export function organizeQuestionsByPillar(qs: Question[], ambiguity = 0.5, counts?: Record<string, number>): Question[] {
  if (!Array.isArray(qs) || qs.length === 0) return [];

  // Group questions by their `category` (we treat that as a pillar label)
  const groups: Record<string, Question[]> = {};
  qs.forEach(q => {
    const key = (q.category || "Misc").toLowerCase();
    (groups[key] ||= []).push(q);
  });

  // Default per-pillar count fallback based on overall ambiguity
  
  const result: Question[] = [];
  for (const pillarKey of Object.keys(groups)) {
    // Determine limit: per-pillar override or default
    const limit = counts?.[pillarKey] ?? (ambiguity >= 0.6 ? 3 : 2);
    result.push(...groups[pillarKey].slice(0, limit));
  }

  return result;
}

// EOF
