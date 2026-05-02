import type { AutofillLine, DayPlan, FoodLibEntry, PlanItem } from "@/types";
import { r } from "@/lib/mealMath";
import { itemKey, parseItemKey } from "@/lib/planQueries";

type Candidate =
  | (Extract<AutofillLine, { type: 1 }> & { mergeHint?: string })
  | (Extract<AutofillLine, { type: 2 }> & { mergeHint?: string });

function buildCandidates(food: FoodLibEntry, excluded: Set<string>): Candidate[] {
  const out: Candidate[] = [];
  if (excluded.has(food.food)) return out;
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
  } else if (food.type === 2) {
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
  } else {
    const pu = { p: food.p, c: food.c, f: food.f };
    out.push({
      food: food.food,
      portion: food.portion,
      p: food.p,
      c: food.c,
      f: food.f,
      type: 2,
      count: 1,
      perUnit: pu,
      mealTypes: food.mealTypes,
      category: food.category,
    });
  }
  return out;
}

function withMergeHint(plan: DayPlan, removedKeys: Set<string>, cand: Candidate): AutofillLine {
  let existing: PlanItem | undefined;
  outer: for (const meal of plan.meals) {
    for (const item of meal.items) {
      const key = itemKey(meal.label, item.food);
      if (item.food === cand.food && !removedKeys.has(key)) {
        existing = item;
        break outer;
      }
    }
  }
  if (!existing) {
    const { mergeHint: _m, ...rest } = cand as Candidate & { mergeHint?: string };
    return rest as AutofillLine;
  }
  let mergeHint = "";
  if (cand.type === 1 && cand.oz != null && existing.type === 1 && existing.oz != null) {
    mergeHint = `Merged: default ${existing.oz}oz + ${cand.oz}oz`;
  } else if (cand.type === 2 && cand.count != null && existing.perUnit) {
    const defCnt = Math.round(existing.p / existing.perUnit.p) || 1;
    mergeHint = `Merged: default ${defCnt} serving(s) + ${cand.count}`;
  } else {
    mergeHint = "Merged with an existing line on the plan";
  }
  return { ...cand, mergeHint };
}

function withinTol(sum: { p: number; c: number; f: number }, need: { p: number; c: number; f: number }, tol: number) {
  return (
    Math.abs(r(sum.p) - need.p) <= tol &&
    Math.abs(r(sum.c) - need.c) <= tol &&
    Math.abs(r(sum.f) - need.f) <= tol
  );
}

function findAutofillAtTol(
  plan: DayPlan,
  removedKeys: Set<string>,
  chosenFoodNames: string[],
  needP: number,
  needC: number,
  needF: number,
  tol: number,
  foodLib: FoodLibEntry[],
): AutofillLine[][] {
  const excluded = new Set([...[...removedKeys].map((k) => parseItemKey(k).food), ...chosenFoodNames]);

  const candidates: Candidate[] = [];
  foodLib.forEach((food) => {
    candidates.push(...buildCandidates(food, excluded));
  });

  const slim = candidates.filter(
    (c) => c.p <= needP + tol + 4 && c.c <= needC + tol + 4 && c.f <= needF + tol + 4,
  );
  const results: AutofillLine[][] = [];
  const need = { p: needP, c: needC, f: needF };

  for (const a of slim) {
    if (results.length >= 6) break;
    if (withinTol({ p: a.p, c: a.c, f: a.f }, need, tol)) {
      results.push([withMergeHint(plan, removedKeys, a)]);
    }
  }
  for (let i = 0; i < slim.length && results.length < 6; i++) {
    for (let j = i + 1; j < slim.length && results.length < 6; j++) {
      const a = slim[i],
        b = slim[j];
      if (a.food === b.food) continue;
      if (withinTol({ p: r(a.p + b.p), c: r(a.c + b.c), f: r(a.f + b.f) }, need, tol)) {
        results.push([withMergeHint(plan, removedKeys, a), withMergeHint(plan, removedKeys, b)]);
      }
    }
  }
  if (results.length < 4) {
    const s2 = slim.slice(0, 50);
    for (let i = 0; i < s2.length && results.length < 6; i++) {
      for (let j = i + 1; j < s2.length && results.length < 6; j++) {
        for (let k = j + 1; k < s2.length && results.length < 6; k++) {
          const a = s2[i],
            b = s2[j],
            c2 = s2[k];
          if (a.food === b.food || a.food === c2.food || b.food === c2.food) continue;
          if (withinTol({ p: r(a.p + b.p + c2.p), c: r(a.c + b.c + c2.c), f: r(a.f + b.f + c2.f) }, need, tol)) {
            results.push([
              withMergeHint(plan, removedKeys, a),
              withMergeHint(plan, removedKeys, b),
              withMergeHint(plan, removedKeys, c2),
            ]);
          }
        }
      }
    }
  }
  return results;
}

export type AutofillToleranceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type AutofillResult = {
  combos: AutofillLine[][];
  tolerance: AutofillToleranceLevel;
  message: string | null;
};

/** Try ±1g … ±5g in order; return first tolerance with results, else empty combos + message. */
export function findAutofill(
  plan: DayPlan,
  removedKeys: Set<string>,
  chosenFoods: { food: string }[],
  needP: number,
  needC: number,
  needF: number,
  foodLib: FoodLibEntry[],
): AutofillResult {
  const chosenNames = chosenFoods.map((x) => x.food);
  const TOLS = [1, 2, 3, 4, 5] as const;
  for (const tol of TOLS) {
    const combos = findAutofillAtTol(plan, removedKeys, chosenNames, needP, needC, needF, tol, foodLib);
    if (combos.length > 0) {
      return {
        combos,
        tolerance: tol,
        message: tol === 1 ? null : `Search tolerance ±${tol}g (P/C/F each)`,
      };
    }
  }
  return {
    combos: [],
    tolerance: 5,
    message: "No combination within ±5g. Go back and adjust portions or picks.",
  };
}
