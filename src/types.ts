export type DayKey = "training" | "nontraining";

export type MealTypeTag = "Bfast" | "Lunch" | "Dinner" | "Snack" | "oil";

export type PerOz = { p: number; c: number; f: number };
export type PerUnit = { p: number; c: number; f: number };

/** Row in default plan */
export type PlanItem = {
  portion: string;
  food: string;
  p: number;
  c: number;
  f: number;
  fixed?: true;
  type?: 1 | 2;
  oz?: number;
  step?: number;
  perOz?: PerOz;
  perUnit?: PerUnit;
};

export type PlanMeal = {
  label: string;
  mealType: MealTypeTag;
  items: PlanItem[];
};

export type MacroTarget = { p: number; c: number; f: number; kcal: number };

export type DayPlan = {
  label: string;
  target: MacroTarget;
  meals: PlanMeal[];
};

/** Macro role: at most one per meal in the solver (primaries + aux combined). */
export type FoodCategory = "protein" | "carbs" | "fat";

/** Library entry (weighable) */
export type FoodLibWeighable = {
  food: string;
  type: 1;
  step: number;
  base: { oz: number };
  perOz: PerOz;
  mealTypes: Exclude<MealTypeTag, "oil">[];
  category: FoodCategory;
};

/** Library entry (countable) */
export type FoodLibCountable = {
  food: string;
  type: 2;
  perUnit: PerUnit;
  mealTypes: Exclude<MealTypeTag, "oil">[];
  category: FoodCategory;
};

/** Library entry (fixed serving — not adjustable in Step 2; macros as one serving). */
export type FoodLibFixed = {
  food: string;
  type: 3;
  portion: string;
  p: number;
  c: number;
  f: number;
  mealTypes: Exclude<MealTypeTag, "oil">[];
  category: FoodCategory;
};

export type FoodLibEntry = FoodLibWeighable | FoodLibCountable | FoodLibFixed;

export type Macros = { p: number; c: number; f: number };

/** Single autofill line item */
export type AutofillLine =
  | {
      food: string;
      portion: string;
      p: number;
      c: number;
      f: number;
      type: 1;
      oz: number;
      step: number;
      perOz: PerOz;
      mealTypes: Exclude<MealTypeTag, "oil">[];
      category: FoodCategory;
      mergeHint?: string;
    }
  | {
      food: string;
      portion: string;
      p: number;
      c: number;
      f: number;
      type: 2;
      count: number;
      perUnit: PerUnit;
      mealTypes: Exclude<MealTypeTag, "oil">[];
      category: FoodCategory;
      mergeHint?: string;
    };

/** v2: Primary replacement line (same shape as autofill, but used for main replacement display) */
export type PrimaryLine = Omit<AutofillLine, "mergeHint">;

/** One primary replacement per removed row (order matches removedKeys expansion). */
export type V2PerRemoval = {
  removedKey: string;
  replacement: PrimaryLine;
};

export type V2Solution = {
  perRemoval: V2PerRemoval[];
  /** Auto-fill lines after primaries (0–2) to balance P/C/F. */
  aux: AutofillLine[];
  totals: Macros & { kcal: number };
  deltas: Macros & { kcal: number };
  /** tolerance used for this solution (P/C/F each) */
  tolerance: 0 | 1 | 2 | 3;
  /** smaller is better */
  score: number;
};

export type AppStep = 1 | 2 | 3;
