import type { MealTypeTag } from "@/types";

/** Display labels for meal-type tags and selectors (internal keys stay Bfast, etc.) */
export const MEAL_TYPE_LABEL: Record<MealTypeTag, string> = {
  Bfast: "Breakfast",
  Lunch: "Lunch",
  Dinner: "Dinner",
  Snack: "Snack",
  oil: "Oil",
};
