import type { MealTypeTag } from "@/types";
import { MEAL_TYPE_LABEL } from "@/lib/mealTypeUi";

const STYLES: Record<string, string> = {
  Bfast: "bg-[#fff3cd] text-[#856404]",
  Lunch: "bg-emerald-50 text-emerald-800",
  Dinner: "bg-sky-50 text-sky-800",
  Snack: "bg-purple-50 text-purple-800",
  oil: "bg-bg text-[#8a8780]",
};

export function MealTypeTag({ t }: { t: MealTypeTag }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${STYLES[t] ?? "bg-bg text-[#8a8780]"}`}>
      {MEAL_TYPE_LABEL[t] ?? t}
    </span>
  );
}
