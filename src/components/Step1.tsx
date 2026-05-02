import { MacroBar } from "@/components/MacroBar";
import { itemKey } from "@/lib/planQueries";
import { useMealPlanStore } from "@/store/mealPlanStore";

export function Step1() {
  const plan = useMealPlanStore((s) => s.plan());
  const removedKeys = useMealPlanStore((s) => s.removedKeys);
  const toggleRemove = useMealPlanStore((s) => s.toggleRemove);
  const clearRemoved = useMealPlanStore((s) => s.clearRemoved);
  const goStep2 = useMealPlanStore((s) => s.goStep2);
  const t = plan.target;
  const cnt = removedKeys.size;

  return (
    <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-[18px] py-3">
          <div>
            <div className="text-[13px] font-semibold">Default meal plan</div>
            <div className="mt-0.5 text-[12px] text-[#8a8780]">Tap rows to mark foods you want replaced</div>
          </div>
        </div>
        <MacroBar p={t.p} c={t.c} f={t.f} kcal={t.kcal} />
        <div className="max-h-[560px] flex-1 overflow-y-auto">
          {plan.meals.map((meal) => (
            <div key={meal.label}>
              <div className="border-b border-border bg-bg px-[18px] py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a8780]">
                {meal.label}
              </div>
              <div
                className="grid gap-1 border-b border-border px-[18px] py-1 text-[10px] font-semibold uppercase tracking-wide text-[#b5b2aa]"
                style={{ gridTemplateColumns: "72px 1fr 36px 36px 36px 36px" }}
              >
                <span className="text-left">Portion</span>
                <span>Food</span>
                <span className="text-right">P</span>
                <span className="text-right">C</span>
                <span className="text-right">F</span>
                <span />
              </div>
              {meal.items.map((item) => {
                const key = itemKey(meal.label, item.food);
                const isSel = removedKeys.has(key);
                if (item.fixed) {
                  return (
                    <div
                      key={key}
                      className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 opacity-[0.42] last:border-b-0"
                      style={{ gridTemplateColumns: "72px 1fr 36px 36px 36px 36px" }}
                    >
                      <span className="text-[12px] text-[#8a8780]">{item.portion}</span>
                      <span className="text-[13px]">{item.food}</span>
                      <span className="text-right text-[12px] text-[#8a8780]">{item.p}</span>
                      <span className="text-right text-[12px] text-[#8a8780]">{item.c}</span>
                      <span className="text-right text-[12px] text-[#8a8780]">{item.f}</span>
                      <span className="flex justify-end text-[9px] uppercase text-[#b5b2aa]">Fixed</span>
                    </div>
                  );
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRemove(meal.label, item.food)}
                    className={`grid w-full cursor-pointer items-center gap-1 border-b border-border px-[18px] py-1.5 text-left transition-colors last:border-b-0 hover:bg-[#f4f3ef] ${
                      isSel ? "bg-[#fce8e8]" : ""
                    }`}
                    style={{ gridTemplateColumns: "72px 1fr 36px 36px 36px 36px" }}
                  >
                    <span className="text-[12px] text-[#8a8780]">{item.portion}</span>
                    <span className={`text-[13px] ${isSel ? "font-medium text-food-removed line-through" : ""}`}>{item.food}</span>
                    <span className="text-right text-[12px] text-[#8a8780]">{item.p}</span>
                    <span className="text-right text-[12px] text-[#8a8780]">{item.c}</span>
                    <span className="text-right text-[12px] text-[#8a8780]">{item.f}</span>
                    <span className="flex justify-end">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] text-white ${
                          isSel ? "border-food-removed bg-food-removed" : "border-[#d0ccc2]"
                        }`}
                      >
                        {isSel ? "✓" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-bg px-[18px] py-3">
          <span className="flex-1 text-[12px] text-[#8a8780]">
            {cnt === 0 ? "No foods selected" : `${cnt} food${cnt === 1 ? "" : "s"} marked for replacement`}
          </span>
          <button type="button" className="btn-ghost" onClick={() => clearRemoved()}>
            Clear
          </button>
          <button type="button" className="btn-primary" disabled={cnt === 0} onClick={() => goStep2()}>
            Search replacements →
          </button>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="border-b border-border px-[18px] py-3">
          <div className="text-[13px] font-semibold">How it works</div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[13px] leading-8 text-[#8a8780]">
          <div className="mb-3 text-[14px] font-semibold text-[#1a1917]">Replace foods in three steps</div>
          <div>
            ① Select foods to <strong className="text-[#1a1917]">remove</strong> (you can pick several), then tap{" "}
            <strong className="text-[#1a1917]">Search replacements</strong>.
          </div>
          <div>
            ② The app <strong className="text-[#1a1917]">searches automatically</strong>: for{" "}
            <strong className="text-[#1a1917]">each removed item</strong> it picks one primary replacement from the library that{" "}
            <strong className="text-[#1a1917]">matches that meal type</strong>, then adds up to two{" "}
            <strong className="text-[#1a1917]">auto-filled</strong> foods to balance P/C/F. You only choose one of the listed options.
          </div>
          <div className="mb-5">
            ③ <strong className="text-[#1a1917]">Confirm</strong>: review the full day, macros vs the default plan, and what changed.
          </div>
          <div className="rounded-md bg-orange-50 p-3 text-[12px] leading-relaxed text-orange-800">
            <strong>Search rules (v2):</strong>
            <br />
            <strong>Primary replacements</strong> are built <strong>per removed row</strong>: one replacement food per removal, from the library and{" "}
            <strong>only for that row’s meal type</strong>; portions sweep weighable foods by oz step and countables from 1–3 servings. With multiple removals, primary replacement <strong>food names must all differ</strong>.
            <br />
            <br />
            <strong>Auto-fill</strong> runs after all primaries are fixed: search the <strong>whole library</strong> (any meal type), at most two extra foods, each food once per solution, each line tagged with suitable meals.
            <br />
            <br />
            <strong>Category rule:</strong> within each meal, <strong>all primaries plus auto-fill combined</strong> may include at most one food per macro role (protein / carbs / fat).
            <br />
            <br />
            <strong>Tolerance:</strong> search at ±1g first; if nothing matches, widen to ±2g, then ±3g (P/C/F independently).
          </div>
        </div>
      </section>
    </div>
  );
}
