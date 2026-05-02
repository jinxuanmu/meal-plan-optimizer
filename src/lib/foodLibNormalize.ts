import type { FoodCategory, FoodLibEntry } from "@/types";

function coerceCategory(v: unknown): FoodCategory {
  return v === "protein" || v === "carbs" || v === "fat" ? v : "protein";
}

/** Back-compat for older localStorage rows missing `category`. */
export function normalizeFoodLibEntry(raw: unknown): FoodLibEntry {
  const o = raw as Record<string, unknown>;
  return { ...o, category: coerceCategory(o.category) } as FoodLibEntry;
}

export function normalizeFoodLibArray(raw: unknown): FoodLibEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeFoodLibEntry);
}
