import { parseNum } from "@/lib/formUtils";
import { MEAL_TYPE_LABEL } from "@/lib/mealTypeUi";
import { r } from "@/lib/mealMath";
import { useMealPlanStore } from "@/store/mealPlanStore";
import type { FoodCategory, FoodLibEntry, MealTypeTag } from "@/types";
import { useState } from "react";

type LibMeal = Exclude<MealTypeTag, "oil">;

const MT_OPTS: LibMeal[] = ["Bfast", "Lunch", "Dinner", "Snack"];

const CAT_OPTS: { value: FoodCategory; label: string }[] = [
  { value: "protein", label: "protein" },
  { value: "carbs", label: "carbs" },
  { value: "fat", label: "fat" },
];

function toggleMealType(list: LibMeal[], t: LibMeal) {
  if (list.includes(t)) return list.filter((x) => x !== t);
  return [...list, t];
}

const newWeighable = (): FoodLibEntry => ({
  food: "",
  type: 1,
  step: 0.5,
  base: { oz: 5 },
  perOz: { p: 0, c: 0, f: 0 },
  mealTypes: ["Lunch"],
  category: "protein",
});

const newCountable = (): FoodLibEntry => ({
  food: "",
  type: 2,
  perUnit: { p: 0, c: 0, f: 0 },
  mealTypes: ["Snack"],
  category: "protein",
});

const newFixed = (): FoodLibEntry => ({
  food: "",
  type: 3,
  portion: "1 serving",
  p: 0,
  c: 0,
  f: 0,
  mealTypes: ["Bfast"],
  category: "protein",
});

export function FoodLibEditor() {
  const foodLib = useMealPlanStore((s) => s.foodLib);
  const updateFoodLibEntry = useMealPlanStore((s) => s.updateFoodLibEntry);
  const addFoodLibEntry = useMealPlanStore((s) => s.addFoodLibEntry);
  const removeFoodLibEntry = useMealPlanStore((s) => s.removeFoodLibEntry);

  const [draftKind, setDraftKind] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<FoodLibEntry>(() => newWeighable());

  function setDraftType(kind: 1 | 2 | 3) {
    setDraftKind(kind);
    if (kind === 1) setDraft(newWeighable());
    else if (kind === 2) setDraft(newCountable());
    else setDraft(newFixed());
  }

  const commitDraft = () => {
    const name = draft.food.trim();
    if (!name) {
      window.alert("Enter a food name");
      return;
    }
    if (foodLib.some((e) => e.food === name)) {
      window.alert("That name already exists. Pick another name or edit the existing entry.");
      return;
    }
    if (draft.type !== 3 && draft.mealTypes.length === 0) {
      window.alert("Select at least one meal type");
      return;
    }
    if (draft.type === 3 && draft.mealTypes.length === 0) {
      window.alert("Select at least one meal type");
      return;
    }
    addFoodLibEntry({ ...draft, food: name } as FoodLibEntry);
    setDraftType(draftKind);
  };

  return (
    <div className="space-y-6">
      <p className="text-[13px] leading-relaxed text-[#8a8780]">
        Type 1: oz with a step (e.g. set step 1.5 for Safe Catch Tuna). Type 2: integer servings. Type 3: fixed macros; portion cannot be tuned in the replacement flow.
      </p>

      {foodLib.map((entry, index) => (
        <div key={`${entry.food}-${index}`} className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-[#8a8780]">
              #{index + 1} ·{" "}
              {entry.type === 1 ? "Type 1" : entry.type === 2 ? "Type 2" : "Type 3 (fixed)"}
            </span>
            <button type="button" className="text-[12px] text-rose-700 hover:underline" onClick={() => removeFoodLibEntry(index)}>
              Delete
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[12px] sm:col-span-2">
              <span className="mb-0.5 block text-[#8a8780]">Food name</span>
              <input
                className="w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={entry.food}
                onChange={(e) => {
                  const next = { ...entry, food: e.target.value } as FoodLibEntry;
                  updateFoodLibEntry(index, next);
                }}
              />
            </label>
            <label className="text-[12px]">
              <span className="mb-0.5 block text-[#8a8780]">Type</span>
              <select
                className="w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={entry.type}
                onChange={(e) => {
                  const v = Number(e.target.value) as 1 | 2 | 3;
                  const mt = entry.mealTypes.length ? entry.mealTypes : (["Lunch"] as LibMeal[]);
                  const cat = entry.category;
                  let p = 0,
                    c = 0,
                    f = 0;
                  if (entry.type === 1) {
                    p = r(entry.perOz.p * entry.base.oz);
                    c = r(entry.perOz.c * entry.base.oz);
                    f = r(entry.perOz.f * entry.base.oz);
                  } else if (entry.type === 2) {
                    p = entry.perUnit.p;
                    c = entry.perUnit.c;
                    f = entry.perUnit.f;
                  } else {
                    p = entry.p;
                    c = entry.c;
                    f = entry.f;
                  }
                  let next: FoodLibEntry;
                  if (v === 1) {
                    const oz = 5;
                    next = {
                      food: entry.food,
                      type: 1,
                      step: 0.5,
                      base: { oz },
                      perOz: { p: oz > 0 ? r(p / oz) : 0, c: oz > 0 ? r(c / oz) : 0, f: oz > 0 ? r(f / oz) : 0 },
                      mealTypes: mt,
                      category: cat,
                    };
                  } else if (v === 2) {
                    next = { food: entry.food, type: 2, perUnit: { p, c, f }, mealTypes: mt, category: cat };
                  } else {
                    next = {
                      food: entry.food,
                      type: 3,
                      portion: entry.type === 3 ? entry.portion : "1 serving",
                      p,
                      c,
                      f,
                      mealTypes: mt,
                      category: cat,
                    };
                  }
                  updateFoodLibEntry(index, next);
                }}
              >
                <option value={1}>1 Weighable (oz)</option>
                <option value={2}>2 Countable</option>
                <option value={3}>3 Fixed serving</option>
              </select>
            </label>
            <label className="text-[12px]">
              <span className="mb-0.5 block text-[#8a8780]">category</span>
              <select
                className="w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={entry.category}
                onChange={(e) =>
                  updateFoodLibEntry(index, { ...entry, category: e.target.value as FoodCategory })
                }
              >
                {CAT_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {entry.type === 1 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-[12px]">
                <span className="mb-0.5 block text-[#8a8780]">Base oz</span>
                <input
                  type="number"
                  step={0.1}
                  className="w-full rounded border border-border px-2 py-1 text-[13px]"
                  value={entry.base.oz}
                  onChange={(e) =>
                    updateFoodLibEntry(index, { ...entry, base: { oz: parseNum(e.target.value, entry.base.oz) } })
                  }
                />
              </label>
              <label className="text-[12px]">
                <span className="mb-0.5 block text-[#8a8780]">Step (oz)</span>
                <input
                  type="number"
                  step={0.1}
                  className="w-full rounded border border-border px-2 py-1 text-[13px]"
                  value={entry.step}
                  onChange={(e) => updateFoodLibEntry(index, { ...entry, step: parseNum(e.target.value, entry.step) })}
                />
              </label>
              {(["p", "c", "f"] as const).map((k) => (
                <label key={k} className="text-[12px]">
                  <span className="mb-0.5 block uppercase text-[#8a8780]">/oz {k}</span>
                  <input
                    type="number"
                    step={0.01}
                    className="w-full rounded border border-border px-2 py-1 text-[13px]"
                    value={entry.perOz[k]}
                    onChange={(e) =>
                      updateFoodLibEntry(index, {
                        ...entry,
                        perOz: { ...entry.perOz, [k]: parseNum(e.target.value, entry.perOz[k]) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {entry.type === 2 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["p", "c", "f"] as const).map((k) => (
                <label key={k} className="text-[12px]">
                  <span className="mb-0.5 block uppercase text-[#8a8780]">Per serving {k}</span>
                  <input
                    type="number"
                    step={0.1}
                    className="w-full rounded border border-border px-2 py-1 text-[13px]"
                    value={entry.perUnit[k]}
                    onChange={(e) =>
                      updateFoodLibEntry(index, {
                        ...entry,
                        perUnit: { ...entry.perUnit, [k]: parseNum(e.target.value, entry.perUnit[k]) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {entry.type === 3 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[12px] sm:col-span-2">
                <span className="mb-0.5 block text-[#8a8780]">Portion label</span>
                <input
                  className="w-full rounded border border-border px-2 py-1 text-[13px]"
                  value={entry.portion}
                  onChange={(e) => updateFoodLibEntry(index, { ...entry, portion: e.target.value })}
                />
              </label>
              {(["p", "c", "f"] as const).map((k) => (
                <label key={k} className="text-[12px]">
                  <span className="mb-0.5 block uppercase text-[#8a8780]">{k}</span>
                  <input
                    type="number"
                    step={0.1}
                    className="w-full rounded border border-border px-2 py-1 text-[13px]"
                    value={entry[k]}
                    onChange={(e) => updateFoodLibEntry(index, { ...entry, [k]: parseNum(e.target.value, entry[k]) })}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="w-full text-[11px] font-semibold uppercase text-[#8a8780]">Meal types</span>
            {MT_OPTS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-1.5 rounded border border-border bg-bg px-2 py-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={entry.mealTypes.includes(t)}
                  onChange={() =>
                    updateFoodLibEntry(index, {
                      ...entry,
                      mealTypes: toggleMealType(entry.mealTypes, t),
                    })
                  }
                />
                {MEAL_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </div>
      ))}

      <section className="rounded-lg border-2 border-dashed border-emerald-700/40 bg-emerald-50/40 p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-emerald-800">Add food</h3>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-[12px] text-[#8a8780]">
            Type
            <select
              className="mt-0.5 block rounded border border-border px-2 py-1 text-[13px]"
              value={draftKind}
              onChange={(e) => setDraftType(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>Type 1</option>
              <option value={2}>Type 2</option>
              <option value={3}>Type 3</option>
            </select>
          </label>
          <label className="text-[12px] text-[#8a8780]">
            category
            <select
              className="mt-0.5 block rounded border border-border px-2 py-1 text-[13px]"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as FoodCategory })}
            >
              {CAT_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {draft.type === 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[12px] sm:col-span-2">
              Food name
              <input
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={draft.food}
                onChange={(e) => setDraft({ ...draft, food: e.target.value })}
              />
            </label>
            <label className="text-[12px]">
              Base oz
              <input
                type="number"
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5"
                value={draft.base.oz}
                onChange={(e) => setDraft({ ...draft, base: { oz: parseNum(e.target.value, draft.base.oz) } })}
              />
            </label>
            <label className="text-[12px]">
              Step (oz)
              <input
                type="number"
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5"
                value={draft.step}
                onChange={(e) => setDraft({ ...draft, step: parseNum(e.target.value, draft.step) })}
              />
            </label>
            {(["p", "c", "f"] as const).map((k) => (
              <label key={k} className="text-[12px]">
                /oz {k}
                <input
                  type="number"
                  className="mt-0.5 w-full rounded border border-border px-2 py-1.5"
                  value={draft.perOz[k]}
                  onChange={(e) =>
                    setDraft({ ...draft, perOz: { ...draft.perOz, [k]: parseNum(e.target.value, draft.perOz[k]) } })
                  }
                />
              </label>
            ))}
          </div>
        )}
        {draft.type === 2 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[12px] sm:col-span-2">
              Food name
              <input
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={draft.food}
                onChange={(e) => setDraft({ ...draft, food: e.target.value })}
              />
            </label>
            {(["p", "c", "f"] as const).map((k) => (
              <label key={k} className="text-[12px]">
                Per serving {k}
                <input
                  type="number"
                  className="mt-0.5 w-full rounded border border-border px-2 py-1.5"
                  value={draft.perUnit[k]}
                  onChange={(e) =>
                    setDraft({ ...draft, perUnit: { ...draft.perUnit, [k]: parseNum(e.target.value, draft.perUnit[k]) } })
                  }
                />
              </label>
            ))}
          </div>
        )}
        {draft.type === 3 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[12px] sm:col-span-2">
              Food name
              <input
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={draft.food}
                onChange={(e) => setDraft({ ...draft, food: e.target.value })}
              />
            </label>
            <label className="text-[12px] sm:col-span-2">
              Portion label
              <input
                className="mt-0.5 w-full rounded border border-border px-2 py-1.5 text-[13px]"
                value={draft.portion}
                onChange={(e) => setDraft({ ...draft, portion: e.target.value })}
              />
            </label>
            {(["p", "c", "f"] as const).map((k) => (
              <label key={k} className="text-[12px]">
                {k}
                <input
                  type="number"
                  className="mt-0.5 w-full rounded border border-border px-2 py-1.5"
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: parseNum(e.target.value, draft[k]) })}
                />
              </label>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {MT_OPTS.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-1.5 rounded border border-border bg-white px-2 py-1 text-[12px]">
              <input
                type="checkbox"
                checked={draft.mealTypes.includes(t)}
                onChange={() => setDraft({ ...draft, mealTypes: toggleMealType(draft.mealTypes, t) })}
              />
              {MEAL_TYPE_LABEL[t]}
            </label>
          ))}
        </div>
        <button type="button" className="btn-primary mt-4" onClick={commitDraft}>
          Add to library
        </button>
      </section>
    </div>
  );
}
