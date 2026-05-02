import type { DayPlan, Macros, MealTypeTag, PlanItem } from "@/types";
import { r } from "@/lib/mealMath";
export function itemKey(mealLabel: string, food: string) {
  return `${mealLabel}|${food}`;
}

export function parseItemKey(key: string): { mealLabel: string; food: string } {
  const i = key.indexOf("|");
  return { mealLabel: key.slice(0, i), food: key.slice(i + 1) };
}

export function getPlanItem(plan: DayPlan, key: string): PlanItem | null {
  const { mealLabel, food } = parseItemKey(key);
  const meal = plan.meals.find((m) => m.label === mealLabel);
  return meal?.items.find((it) => it.food === food) ?? null;
}

export function getMealType(plan: DayPlan, key: string): MealTypeTag | null {
  const { mealLabel } = parseItemKey(key);
  const meal = plan.meals.find((m) => m.label === mealLabel);
  return meal?.mealType ?? null;
}

export function getRemovedMealTypes(plan: DayPlan, removedKeys: Set<string>): Set<Exclude<MealTypeTag, "oil">> {
  const s = new Set<Exclude<MealTypeTag, "oil">>();
  removedKeys.forEach((k) => {
    const t = getMealType(plan, k);
    if (t && t !== "oil") s.add(t);
  });
  return s;
}

export function calcFixed(plan: DayPlan, removedKeys: Set<string>): { p: number; c: number; f: number } {
  let p = 0,
    c = 0,
    f = 0;
  plan.meals.forEach((meal) => {
    meal.items.forEach((item) => {
      if (!removedKeys.has(itemKey(meal.label, item.food))) {
        p += item.p;
        c += item.c;
        f += item.f;
      }
    });
  });
  return { p: r(p), c: r(c), f: r(f) };
}

export function calcGap(
  plan: DayPlan,
  removedKeys: Set<string>,
  extra: Macros = { p: 0, c: 0, f: 0 },
) {
  const t = plan.target;
  const fix = calcFixed(plan, removedKeys);
  return {
    p: r(t.p - fix.p - extra.p),
    c: r(t.c - fix.c - extra.c),
    f: r(t.f - fix.f - extra.f),
  };
}
