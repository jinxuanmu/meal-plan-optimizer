import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_FOOD_LIB, DEFAULT_PLANS } from "@/data/defaultData";
import { normalizeFoodLibArray } from "@/lib/foodLibNormalize";
import { solveV2 } from "@/lib/solverV2";
import { itemKey } from "@/lib/planQueries";
import type {
  AppStep,
  DayKey,
  DayPlan,
  FoodLibEntry,
  MacroTarget,
  PlanItem,
  PlanMeal,
  V2Solution,
} from "@/types";

type MealPlanState = {
  plans: Record<DayKey, DayPlan>;
  foodLib: FoodLibEntry[];
  currentDay: DayKey;
  step: AppStep;
  removedKeys: Set<string>;
  solutions: V2Solution[];
  solveMessage: string | null;
  solveTolerance: 0 | 1 | 2 | 3;
  pickedSolutionIdx: number | null;
  dataEditorOpen: boolean;
  dataEditorTab: "plan" | "foodlib";

  plan: () => DayPlan;
  setDay: (d: DayKey) => void;
  setStep: (s: AppStep) => void;
  toggleRemove: (mealLabel: string, food: string) => void;
  clearRemoved: () => void;
  goStep1: () => void;
  goStep2: () => void;
  pickSolution: (idx: number) => void;
  resetFlow: () => void;

  setDataEditorOpen: (open: boolean) => void;
  setDataEditorTab: (tab: "plan" | "foodlib") => void;
  setPlanForDay: (day: DayKey, plan: DayPlan) => void;
  updatePlanTarget: (day: DayKey, target: Partial<MacroTarget>) => void;
  updatePlanMeal: (day: DayKey, mealIndex: number, meal: PlanMeal) => void;
  addPlanMeal: (day: DayKey, meal: PlanMeal) => void;
  removePlanMeal: (day: DayKey, mealIndex: number) => void;
  updatePlanItem: (day: DayKey, mealIndex: number, itemIndex: number, item: PlanItem) => void;
  addPlanItem: (day: DayKey, mealIndex: number, item: PlanItem) => void;
  removePlanItem: (day: DayKey, mealIndex: number, itemIndex: number) => void;
  setFoodLib: (entries: FoodLibEntry[]) => void;
  updateFoodLibEntry: (index: number, entry: FoodLibEntry) => void;
  addFoodLibEntry: (entry: FoodLibEntry) => void;
  removeFoodLibEntry: (index: number) => void;
  resetDataToDefaults: () => void;
};

function cloneDefaults() {
  return {
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)) as Record<DayKey, DayPlan>,
    foodLib: JSON.parse(JSON.stringify(DEFAULT_FOOD_LIB)) as FoodLibEntry[],
  };
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      ...cloneDefaults(),
      currentDay: "training",
      step: 1,
      removedKeys: new Set(),
      solutions: [],
      solveMessage: null,
      solveTolerance: 0,
      pickedSolutionIdx: null,
      dataEditorOpen: false,
      dataEditorTab: "plan" as const,

      plan: () => get().plans[get().currentDay],

      setDay: (d) =>
        set({
          currentDay: d,
          step: 1,
          removedKeys: new Set(),
          solutions: [],
          solveMessage: null,
          solveTolerance: 0,
          pickedSolutionIdx: null,
        }),

      setStep: (s) => set({ step: s }),

      toggleRemove: (mealLabel, food) => {
        const key = itemKey(mealLabel, food);
        const next = new Set(get().removedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        set({
          removedKeys: next,
          solutions: [],
          solveMessage: null,
          solveTolerance: 0,
          pickedSolutionIdx: null,
        });
      },

      clearRemoved: () =>
        set({
          removedKeys: new Set(),
          solutions: [],
          solveMessage: null,
          solveTolerance: 0,
          pickedSolutionIdx: null,
        }),

      goStep1: () => set({ step: 1 }),

      goStep2: () => {
        const plan = get().plan();
        const { removedKeys, foodLib } = get();
        const res = solveV2(plan, removedKeys, foodLib);
        set({
          step: 2,
          solutions: res.solutions,
          solveMessage: res.message,
          solveTolerance: res.tolerance,
          pickedSolutionIdx: null,
        });
      },

      pickSolution: (idx) => {
        const sols = get().solutions;
        if (!sols[idx]) return;
        set({ pickedSolutionIdx: idx, step: 3 });
      },

      resetFlow: () =>
        set({
          step: 1,
          removedKeys: new Set(),
          solutions: [],
          solveMessage: null,
          solveTolerance: 0,
          pickedSolutionIdx: null,
        }),

      setDataEditorOpen: (dataEditorOpen) => set({ dataEditorOpen }),
      setDataEditorTab: (dataEditorTab) => set({ dataEditorTab }),

      setPlanForDay: (day, plan) =>
        set((s) => ({
          plans: { ...s.plans, [day]: plan },
        })),

      updatePlanTarget: (day, partial) =>
        set((s) => {
          const cur = s.plans[day];
          const target = { ...cur.target, ...partial };
          return { plans: { ...s.plans, [day]: { ...cur, target } } };
        }),

      updatePlanMeal: (day, mealIndex, meal) =>
        set((s) => {
          const cur = s.plans[day];
          const meals = cur.meals.map((m, i) => (i === mealIndex ? meal : m));
          return { plans: { ...s.plans, [day]: { ...cur, meals } } };
        }),

      addPlanMeal: (day, meal) =>
        set((s) => {
          const cur = s.plans[day];
          return { plans: { ...s.plans, [day]: { ...cur, meals: [...cur.meals, meal] } } };
        }),

      removePlanMeal: (day, mealIndex) =>
        set((s) => {
          const cur = s.plans[day];
          const meals = cur.meals.filter((_, i) => i !== mealIndex);
          return { plans: { ...s.plans, [day]: { ...cur, meals } } };
        }),

      updatePlanItem: (day, mealIndex, itemIndex, item) =>
        set((s) => {
          const cur = s.plans[day];
          const meals = cur.meals.map((meal, mi) => {
            if (mi !== mealIndex) return meal;
            const items = meal.items.map((it, ii) => (ii === itemIndex ? item : it));
            return { ...meal, items };
          });
          return { plans: { ...s.plans, [day]: { ...cur, meals } } };
        }),

      addPlanItem: (day, mealIndex, item) =>
        set((s) => {
          const cur = s.plans[day];
          const meals = cur.meals.map((meal, mi) =>
            mi === mealIndex ? { ...meal, items: [...meal.items, item] } : meal,
          );
          return { plans: { ...s.plans, [day]: { ...cur, meals } } };
        }),

      removePlanItem: (day, mealIndex, itemIndex) =>
        set((s) => {
          const cur = s.plans[day];
          const meals = cur.meals.map((meal, mi) =>
            mi === mealIndex ? { ...meal, items: meal.items.filter((_, ii) => ii !== itemIndex) } : meal,
          );
          return { plans: { ...s.plans, [day]: { ...cur, meals } } };
        }),

      setFoodLib: (foodLib) => set({ foodLib }),

      updateFoodLibEntry: (index, entry) =>
        set((s) => {
          const foodLib = s.foodLib.map((e, i) => (i === index ? entry : e));
          return { foodLib };
        }),

      addFoodLibEntry: (entry) => set((s) => ({ foodLib: [...s.foodLib, entry] })),

      removeFoodLibEntry: (index) =>
        set((s) => ({
          foodLib: s.foodLib.filter((_, i) => i !== index),
        })),

      resetDataToDefaults: () =>
        set({
          ...cloneDefaults(),
          removedKeys: new Set(),
          step: 1,
          solutions: [],
          solveMessage: null,
          solveTolerance: 0,
          pickedSolutionIdx: null,
        }),
    }),
    {
      name: "meal-plan-optimizer-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ plans: s.plans, foodLib: s.foodLib }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<Pick<MealPlanState, "plans" | "foodLib">>;
        return {
          ...current,
          ...p,
          foodLib: Array.isArray(p.foodLib) ? normalizeFoodLibArray(p.foodLib) : current.foodLib,
        };
      },
    },
  ),
);
