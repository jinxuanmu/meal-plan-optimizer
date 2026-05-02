import { parseNum } from "@/lib/formUtils";
import { MEAL_TYPE_LABEL } from "@/lib/mealTypeUi";
import { useMealPlanStore } from "@/store/mealPlanStore";
import type { DayKey, MealTypeTag, PlanItem, PlanMeal } from "@/types";
import { useState } from "react";

const MEAL_TYPES: MealTypeTag[] = ["Bfast", "Lunch", "Dinner", "Snack", "oil"];

function itemShape(it: PlanItem): "raw" | "t1" | "t2" {
  if (it.fixed) return "raw";
  if (it.type === 1) return "t1";
  if (it.type === 2) return "t2";
  return "raw";
}

function buildPlanItem(
  portion: string,
  food: string,
  p: number,
  c: number,
  f: number,
  fixed: boolean,
  shape: "raw" | "t1" | "t2",
  oz: number,
  step: number,
  perOzP: number,
  perOzC: number,
  perOzF: number,
  puP: number,
  puC: number,
  puF: number,
): PlanItem {
  const base = { portion, food, p, c, f };
  if (fixed) return { ...base, fixed: true };
  if (shape === "t1") {
    return {
      ...base,
      type: 1,
      oz,
      step: step || 0.5,
      perOz: { p: perOzP, c: perOzC, f: perOzF },
    };
  }
  if (shape === "t2") {
    return {
      ...base,
      type: 2,
      perUnit: { p: puP, c: puC, f: puF },
    };
  }
  return { ...base };
}

const emptyItem = (): PlanItem => ({
  portion: "1oz",
  food: "New food",
  p: 0,
  c: 0,
  f: 0,
  type: 1,
  oz: 1,
  step: 0.5,
  perOz: { p: 0, c: 0, f: 0 },
});

const emptyMeal = (): PlanMeal => ({
  label: "New meal",
  mealType: "Snack",
  items: [emptyItem()],
});

export function PlanDayEditor() {
  const [dayKey, setDayKey] = useState<DayKey>("training");
  const plan = useMealPlanStore((s) => s.plans[dayKey]);
  const updatePlanTarget = useMealPlanStore((s) => s.updatePlanTarget);
  const updatePlanMeal = useMealPlanStore((s) => s.updatePlanMeal);
  const addPlanMeal = useMealPlanStore((s) => s.addPlanMeal);
  const removePlanMeal = useMealPlanStore((s) => s.removePlanMeal);
  const updatePlanItem = useMealPlanStore((s) => s.updatePlanItem);
  const addPlanItem = useMealPlanStore((s) => s.addPlanItem);
  const removePlanItem = useMealPlanStore((s) => s.removePlanItem);

  const t = plan.target;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["training", "nontraining"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDayKey(d)}
            className={`rounded-md border px-4 py-2 text-[13px] font-medium ${
              dayKey === d ? "border-ui bg-ui-soft text-ui" : "border-border bg-white text-[#8a8780]"
            }`}
          >
            {d === "training" ? "Training Day" : "Non-Training Day"}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-[#1a1917]">Daily targets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["p", "Protein (g)", t.p],
              ["c", "Carbs (g)", t.c],
              ["f", "Fat (g)", t.f],
              ["kcal", "Calories", t.kcal],
            ] as const
          ).map(([key, label, val]) => (
            <label key={key} className="block text-[12px]">
              <span className="mb-1 block text-[#8a8780]">{label}</span>
              <input
                className="w-full rounded border border-border px-2 py-1.5 text-[13px]"
                type="number"
                step={key === "kcal" ? 1 : 0.1}
                value={val}
                onChange={(e) =>
                  updatePlanTarget(dayKey, { [key]: parseNum(e.target.value, val) } as Partial<typeof t>)
                }
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" className="btn-ghost text-[12px]" onClick={() => addPlanMeal(dayKey, emptyMeal())}>
          + Add meal
        </button>
      </div>

      {plan.meals.map((meal, mealIndex) => (
        <section key={mealIndex} className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-end gap-3 border-b border-border pb-3">
            <label className="min-w-[140px] flex-1 text-[12px]">
              <span className="mb-1 block text-[#8a8780]">Meal name (Step 1 row key)</span>
              <input
                className="w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={meal.label}
                onChange={(e) => updatePlanMeal(dayKey, mealIndex, { ...meal, label: e.target.value })}
              />
            </label>
            <label className="text-[12px]">
              <span className="mb-1 block text-[#8a8780]">Meal type</span>
              <select
                className="rounded border border-border px-2 py-1.5 text-[13px]"
                value={meal.mealType}
                onChange={(e) =>
                  updatePlanMeal(dayKey, mealIndex, { ...meal, mealType: e.target.value as MealTypeTag })
                }
              >
                {MEAL_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {MEAL_TYPE_LABEL[mt]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-ghost py-1.5 text-[12px] text-rose-700"
              onClick={() => removePlanMeal(dayKey, mealIndex)}
            >
              Delete meal
            </button>
          </div>

          <div className="space-y-4">
            {meal.items.map((item, itemIndex) => {
              const shape = itemShape(item);
              const oz = item.type === 1 ? item.oz ?? 1 : 1;
              const step = item.type === 1 ? item.step ?? 0.5 : 0.5;
              const perOz = item.type === 1 ? item.perOz ?? { p: 0, c: 0, f: 0 } : { p: 0, c: 0, f: 0 };
              const pu = item.type === 2 ? item.perUnit ?? { p: 0, c: 0, f: 0 } : { p: 0, c: 0, f: 0 };

              const apply = (patch: Partial<PlanItem>) => {
                const next = { ...item, ...patch };
                updatePlanItem(dayKey, mealIndex, itemIndex, next);
              };

              return (
                <div key={itemIndex} className="rounded-md border border-border bg-bg p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase text-[#8a8780]">Food {itemIndex + 1}</span>
                    <button
                      type="button"
                      className="text-[12px] text-rose-700 hover:underline"
                      onClick={() => removePlanItem(dayKey, mealIndex, itemIndex)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-[12px]">
                      <span className="mb-0.5 block text-[#8a8780]">Portion</span>
                      <input
                        className="w-full rounded border border-border px-2 py-1 text-[13px]"
                        value={item.portion}
                        onChange={(e) => apply({ portion: e.target.value })}
                      />
                    </label>
                    <label className="text-[12px]">
                      <span className="mb-0.5 block text-[#8a8780]">Food name</span>
                      <input
                        className="w-full rounded border border-border px-2 py-1 text-[13px]"
                        value={item.food}
                        onChange={(e) => apply({ food: e.target.value })}
                      />
                    </label>
                    {(["p", "c", "f"] as const).map((k) => (
                      <label key={k} className="text-[12px]">
                        <span className="mb-0.5 block uppercase text-[#8a8780]">{k}</span>
                        <input
                          type="number"
                          step={0.1}
                          className="w-full rounded border border-border px-2 py-1 text-[13px]"
                          value={item[k]}
                          onChange={(e) => apply({ [k]: parseNum(e.target.value, item[k]) })}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        checked={!!item.fixed}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updatePlanItem(dayKey, mealIndex, itemIndex, {
                              portion: item.portion,
                              food: item.food,
                              p: item.p,
                              c: item.c,
                              f: item.f,
                              fixed: true,
                            });
                          } else {
                            const next = { ...item } as PlanItem & { fixed?: true };
                            delete next.fixed;
                            updatePlanItem(dayKey, mealIndex, itemIndex, next);
                          }
                        }}
                      />
                      Fixed (not replaceable)
                    </label>
                    {!item.fixed && (
                      <>
                        <span className="text-[12px] text-[#8a8780]">Macro model</span>
                        <select
                          className="rounded border border-border px-2 py-1 text-[12px]"
                          value={shape}
                          onChange={(e) => {
                            const v = e.target.value as "raw" | "t1" | "t2";
                            if (v === "raw") {
                              updatePlanItem(dayKey, mealIndex, itemIndex, {
                                portion: item.portion,
                                food: item.food,
                                p: item.p,
                                c: item.c,
                                f: item.f,
                              });
                            } else if (v === "t1") {
                              updatePlanItem(
                                dayKey,
                                mealIndex,
                                itemIndex,
                                buildPlanItem(
                                  item.portion,
                                  item.food,
                                  item.p,
                                  item.c,
                                  item.f,
                                  false,
                                  "t1",
                                  item.type === 1 ? item.oz ?? 1 : 1,
                                  item.type === 1 ? item.step ?? 0.5 : 0.5,
                                  item.type === 1 ? item.perOz?.p ?? 0 : item.p,
                                  item.type === 1 ? item.perOz?.c ?? 0 : item.c,
                                  item.type === 1 ? item.perOz?.f ?? 0 : item.f,
                                  0,
                                  0,
                                  0,
                                ),
                              );
                            } else {
                              updatePlanItem(
                                dayKey,
                                mealIndex,
                                itemIndex,
                                buildPlanItem(
                                  item.portion,
                                  item.food,
                                  item.p,
                                  item.c,
                                  item.f,
                                  false,
                                  "t2",
                                  1,
                                  0.5,
                                  0,
                                  0,
                                  0,
                                  item.type === 2 ? item.perUnit?.p ?? item.p : item.p,
                                  item.type === 2 ? item.perUnit?.c ?? item.c : item.c,
                                  item.type === 2 ? item.perUnit?.f ?? item.f : item.f,
                                ),
                              );
                            }
                          }}
                        >
                          <option value="raw">This row only (no type)</option>
                          <option value="t1">Type 1 (by oz)</option>
                          <option value="t2">Type 2 (by serving)</option>
                        </select>
                      </>
                    )}
                  </div>
                  {!item.fixed && shape === "t1" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <label className="text-[12px]">
                        <span className="mb-0.5 block text-[#8a8780]">oz</span>
                        <input
                          type="number"
                          step={0.1}
                          className="w-full rounded border border-border px-2 py-1 text-[13px]"
                          value={oz}
                          onChange={(e) =>
                            updatePlanItem(
                              dayKey,
                              mealIndex,
                              itemIndex,
                              buildPlanItem(
                                item.portion,
                                item.food,
                                item.p,
                                item.c,
                                item.f,
                                false,
                                "t1",
                                parseNum(e.target.value, oz),
                                step,
                                perOz.p,
                                perOz.c,
                                perOz.f,
                                0,
                                0,
                                0,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="text-[12px]">
                        <span className="mb-0.5 block text-[#8a8780]">Step (oz)</span>
                        <input
                          type="number"
                          step={0.1}
                          className="w-full rounded border border-border px-2 py-1 text-[13px]"
                          value={step}
                          onChange={(e) =>
                            updatePlanItem(
                              dayKey,
                              mealIndex,
                              itemIndex,
                              buildPlanItem(
                                item.portion,
                                item.food,
                                item.p,
                                item.c,
                                item.f,
                                false,
                                "t1",
                                oz,
                                parseNum(e.target.value, step),
                                perOz.p,
                                perOz.c,
                                perOz.f,
                                0,
                                0,
                                0,
                              ),
                            )
                          }
                        />
                      </label>
                      {(["P", "C", "F"] as const).map((axis) => {
                        const k = axis === "P" ? "p" : axis === "C" ? "c" : "f";
                        const v = perOz[k as "p" | "c" | "f"];
                        return (
                          <label key={axis} className="text-[12px]">
                            <span className="mb-0.5 block text-[#8a8780]">Per oz {axis}</span>
                            <input
                              type="number"
                              step={0.01}
                              className="w-full rounded border border-border px-2 py-1 text-[13px]"
                              value={v}
                              onChange={(e) => {
                                const next = { ...perOz, [k]: parseNum(e.target.value, v) };
                                updatePlanItem(
                                  dayKey,
                                  mealIndex,
                                  itemIndex,
                                  buildPlanItem(
                                    item.portion,
                                    item.food,
                                    item.p,
                                    item.c,
                                    item.f,
                                    false,
                                    "t1",
                                    oz,
                                    step,
                                    next.p,
                                    next.c,
                                    next.f,
                                    0,
                                    0,
                                    0,
                                  ),
                                );
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {!item.fixed && shape === "t2" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {(["p", "c", "f"] as const).map((k) => (
                        <label key={k} className="text-[12px]">
                          <span className="mb-0.5 block uppercase text-[#8a8780]">Per serving {k}</span>
                          <input
                            type="number"
                            step={0.1}
                            className="w-full rounded border border-border px-2 py-1 text-[13px]"
                            value={pu[k]}
                            onChange={(e) => {
                              const next = { ...pu, [k]: parseNum(e.target.value, pu[k]) };
                              updatePlanItem(
                                dayKey,
                                mealIndex,
                                itemIndex,
                                buildPlanItem(
                                  item.portion,
                                  item.food,
                                  item.p,
                                  item.c,
                                  item.f,
                                  false,
                                  "t2",
                                  1,
                                  0.5,
                                  0,
                                  0,
                                  0,
                                  next.p,
                                  next.c,
                                  next.f,
                                ),
                              );
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-3 text-[12px] font-medium text-emerald-800 hover:underline"
            onClick={() => addPlanItem(dayKey, mealIndex, emptyItem())}
          >
            + Add food to this meal
          </button>
        </section>
      ))}
    </div>
  );
}
