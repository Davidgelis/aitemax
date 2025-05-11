
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

export function organizeQuestionsByPillar(qs: Question[], ambiguity = 0.5): Question[] {
  if (!Array.isArray(qs) || qs.length === 0) return [];

  // Group questions by their `category` (we treat that as a pillar label)
  const groups: Record<string, Question[]> = {};
  qs.forEach(q => {
    const key = (q.category || "Misc").toLowerCase();
    (groups[key] ||= []).push(q);
  });

  const maxPerPillar = ambiguity >= 0.6 ? 3 : 2; // more Qs when ambiguous

  const result: Question[] = [];
  for (const pillar of Object.keys(groups)) {
    // Stable sort so original generation order is respected
    result.push(...groups[pillar].slice(0, maxPerPillar));
  }

  return result;
}

// EOF
