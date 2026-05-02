import type { AutofillLine, DayPlan, FoodCategory, FoodLibEntry, Macros, MealTypeTag, PrimaryLine, V2PerRemoval, V2Solution } from "@/types";
import { kcalFromMacros, r, r0 } from "@/lib/mealMath";
import { calcFixed, getMealType, itemKey, parseItemKey } from "@/lib/planQueries";

type LibMeal = Exclude<MealTypeTag, "oil">;

type Candidate =
  | (Extract<AutofillLine, { type: 1 }> & { mergeHint?: string })
  | (Extract<AutofillLine, { type: 2 }> & { mergeHint?: string });

/** Max candidates per removal slot when multiple removals (combinatorial cap); single removal has no cap. */
const MAX_POOL_PER_SLOT_MULTI = 72;
const MAX_ENUM_NODES = 25000;
const MAX_COLLECT_SOLUTIONS = 80;

function buildCandidates(food: FoodLibEntry, excluded: Set<string>): Candidate[] {
  const out: Candidate[] = [];
  if (excluded.has(food.food)) return out;
  if (food.type === 3) return out;

  if (food.type === 1) {
    const step = food.step || 0.5;
    for (let oz = step; oz <= food.base.oz * 2.5; oz = r(oz + step)) {
      out.push({
        food: food.food,
        portion: `${oz}oz`,
        p: r(food.perOz.p * oz),
        c: r(food.perOz.c * oz),
        f: r(food.perOz.f * oz),
        type: 1,
        oz,
        step,
        perOz: food.perOz,
        mealTypes: food.mealTypes,
        category: food.category,
      });
    }
  } else {
    for (let n = 1; n <= 3; n++) {
      out.push({
        food: food.food,
        portion: n === 1 ? "1 serving" : `${n} servings`,
        p: food.perUnit.p * n,
        c: food.perUnit.c * n,
        f: food.perUnit.f * n,
        type: 2,
        count: n,
        perUnit: food.perUnit,
        mealTypes: food.mealTypes,
        category: food.category,
      });
    }
  }
  return out;
}

function withinTol(sum: Macros, need: Macros, tol: number) {
  return Math.abs(r(sum.p) - need.p) <= tol && Math.abs(r(sum.c) - need.c) <= tol && Math.abs(r(sum.f) - need.f) <= tol;
}

const ALL_LIB_MEALS: LibMeal[] = ["Bfast", "Lunch", "Dinner", "Snack"];

/** At most one food per macro role (category) within each meal (primaries + aux). */
function violatesSameMealCategoryMulti(primaries: PrimaryLine[], aux: AutofillLine[]): boolean {
  const lines: { mealTypes: LibMeal[]; category: FoodCategory }[] = [...primaries, ...aux];
  for (const m of ALL_LIB_MEALS) {
    const seen = new Set<FoodCategory>();
    for (const line of lines) {
      if (!line.mealTypes.includes(m)) continue;
      if (seen.has(line.category)) return true;
      seen.add(line.category);
    }
  }
  return false;
}

function withMergeHint(plan: DayPlan, removedKeys: Set<string>, cand: Candidate): AutofillLine {
  let existing: { type?: 1 | 2; oz?: number; perUnit?: { p: number; c: number; f: number }; p: number } | undefined;
  outer: for (const meal of plan.meals) {
    for (const item of meal.items) {
      const key = itemKey(meal.label, item.food);
      if (item.food === cand.food && !removedKeys.has(key)) {
        existing = item;
        break outer;
      }
    }
  }
  if (!existing) return cand as AutofillLine;

  let mergeHint = "";
  if (cand.type === 1 && cand.oz != null && existing.type === 1 && existing.oz != null) {
    mergeHint = `Merged: default ${existing.oz}oz + ${cand.oz}oz`;
  } else if (cand.type === 2 && cand.count != null && existing.perUnit) {
    const defCnt = Math.round(existing.p / existing.perUnit.p) || 1;
    mergeHint = `Merged: default ${defCnt} serving(s) + ${cand.count}`;
  } else {
    mergeHint = "Merged with an existing line on the plan";
  }
  return { ...(cand as AutofillLine), mergeHint };
}

/** Primary replacement pool for a removal’s meal type (one pool per removed item). */
function buildPoolForMealType(
  mt: LibMeal,
  removedFoodNames: Set<string>,
  foodLib: FoodLibEntry[],
  maxTotal: number | null,
): PrimaryLine[] {
  const pool: PrimaryLine[] = [];
  for (const entry of foodLib) {
    if (entry.type === 3) continue;
    if (removedFoodNames.has(entry.food)) continue;
    if (!entry.mealTypes.includes(mt)) continue;
    for (const c of buildCandidates(entry, removedFoodNames)) {
      pool.push(c as PrimaryLine);
      if (maxTotal != null && pool.length >= maxTotal) return pool;
    }
  }
  return pool;
}

type RemovalSlot = { key: string; mealType: LibMeal; mealLabel: string };

function removalSlotsOrdered(plan: DayPlan, removedKeys: Set<string>): RemovalSlot[] {
  const out: RemovalSlot[] = [];
  for (const key of removedKeys) {
    const mt = getMealType(plan, key);
    if (!mt || mt === "oil") continue;
    const { mealLabel } = parseItemKey(key);
    out.push({ key, mealType: mt as LibMeal, mealLabel });
  }
  return out;
}

function findAuxAtTol(
  plan: DayPlan,
  removedKeys: Set<string>,
  excludedNames: Set<string>,
  need: Macros,
  tol: number,
  foodLib: FoodLibEntry[],
  primaries: PrimaryLine[],
): AutofillLine[][] {
  const candidates: Candidate[] = [];
  for (const entry of foodLib) candidates.push(...buildCandidates(entry, excludedNames));

  const slim = candidates.filter((c) => c.p <= need.p + tol + 4 && c.c <= need.c + tol + 4 && c.f <= need.f + tol + 4);

  const results: AutofillLine[][] = [];

  /** Allow zero aux lines when primaries already hit targets. */
  if (withinTol({ p: 0, c: 0, f: 0 }, need, tol)) {
    results.push([]);
  }

  for (const a of slim) {
    if (results.length >= 6) break;
    if (violatesSameMealCategoryMulti(primaries, [a])) continue;
    if (withinTol({ p: a.p, c: a.c, f: a.f }, need, tol)) results.push([withMergeHint(plan, removedKeys, a)]);
  }

  for (let i = 0; i < slim.length && results.length < 6; i++) {
    for (let j = i + 1; j < slim.length && results.length < 6; j++) {
      const a = slim[i], b = slim[j];
      if (a.food === b.food) continue;
      const pair = [withMergeHint(plan, removedKeys, a), withMergeHint(plan, removedKeys, b)];
      if (violatesSameMealCategoryMulti(primaries, pair)) continue;
      if (withinTol({ p: r(a.p + b.p), c: r(a.c + b.c), f: r(a.f + b.f) }, need, tol)) {
        results.push(pair);
      }
    }
  }
  return results;
}

function solutionScore(d: Macros & { kcal: number }): number {
  return Math.abs(d.p) + Math.abs(d.c) + Math.abs(d.f) + Math.abs(d.kcal) / 50;
}

export type V2SolveResult = {
  solutions: V2Solution[];
  tolerance: 0 | 1 | 2 | 3;
  message: string | null;
};

export function solveV2(plan: DayPlan, removedKeys: Set<string>, foodLib: FoodLibEntry[]): V2SolveResult {
  const fixed = calcFixed(plan, removedKeys);
  const t = plan.target;
  const slots = removalSlotsOrdered(plan, removedKeys);
  const removedNames = new Set([...removedKeys].map((k) => parseItemKey(k).food));

  if (slots.length === 0) {
    return { solutions: [], tolerance: 3, message: "No foods selected to remove" };
  }

  const slotCap = slots.length === 1 ? null : MAX_POOL_PER_SLOT_MULTI;
  const pools = slots.map((s) => buildPoolForMealType(s.mealType, removedNames, foodLib, slotCap));
  if (pools.some((p) => p.length === 0)) {
    return {
      solutions: [],
      tolerance: 3,
      message: "Some removed meals have no replacement candidates in the food library. Add foods or change your selection.",
    };
  }

  const k = slots.length;

  const TOLS = [1, 2, 3] as const;
  for (const tol of TOLS) {
    let enumCount = 0;
    const solutions: V2Solution[] = [];

    const tryChosen = (chosen: PrimaryLine[]) => {
      const sumP = chosen.reduce((a, c) => r(a + c.p), 0);
      const sumC = chosen.reduce((a, c) => r(a + c.c), 0);
      const sumF = chosen.reduce((a, c) => r(a + c.f), 0);
      const need: Macros = {
        p: r(t.p - fixed.p - sumP),
        c: r(t.c - fixed.c - sumC),
        f: r(t.f - fixed.f - sumF),
      };
      const excluded = new Set<string>([...removedNames, ...chosen.map((c) => c.food)]);
      const auxCombos = findAuxAtTol(plan, removedKeys, excluded, need, tol, foodLib, chosen);
      for (const aux of auxCombos) {
        const auxSum = aux.reduce((acc, x) => ({ p: r(acc.p + x.p), c: r(acc.c + x.c), f: r(acc.f + x.f) }), { p: 0, c: 0, f: 0 });
        const totals = {
          p: r(fixed.p + sumP + auxSum.p),
          c: r(fixed.c + sumC + auxSum.c),
          f: r(fixed.f + sumF + auxSum.f),
          kcal: r0(kcalFromMacros({ p: fixed.p + sumP + auxSum.p, c: fixed.c + sumC + auxSum.c, f: fixed.f + sumF + auxSum.f })),
        };
        const deltas = {
          p: r(totals.p - t.p),
          c: r(totals.c - t.c),
          f: r(totals.f - t.f),
          kcal: totals.kcal - t.kcal,
        };
        const perRemoval: V2PerRemoval[] = slots.map((s, i) => ({
          removedKey: s.key,
          replacement: chosen[i]!,
        }));
        solutions.push({
          perRemoval,
          aux,
          totals,
          deltas,
          tolerance: tol,
          score: solutionScore(deltas),
        });
        if (solutions.length >= MAX_COLLECT_SOLUTIONS) return;
      }
    };

    const dfs = (slotIdx: number, chosen: PrimaryLine[]) => {
      if (solutions.length >= MAX_COLLECT_SOLUTIONS) return;
      if (slotIdx === k) {
        tryChosen(chosen);
        return;
      }
      if (++enumCount > MAX_ENUM_NODES) return;
      for (const cand of pools[slotIdx]!) {
        if (chosen.some((c) => c.food === cand.food)) continue;
        chosen.push(cand);
        dfs(slotIdx + 1, chosen);
        chosen.pop();
      }
    };

    dfs(0, []);

    if (solutions.length > 0) {
      solutions.sort((a, b) => a.score - b.score);
      return {
        solutions: solutions.slice(0, 6),
        tolerance: tol,
        message: tol === 1 ? null : `Tolerance ±${tol}g (P/C/F each)`,
      };
    }
  }

  return {
    solutions: [],
    tolerance: 3,
    message: "No plans found (tolerance widened to ±3g). Try expanding the food library or removing fewer items.",
  };
}
