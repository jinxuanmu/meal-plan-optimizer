import { MealTypeTag } from "@/components/MealTypeTag";
import { useMealPlanStore } from "@/store/mealPlanStore";

function MacroPill({ label, value, delta, color }: { label: string; value: number; delta: number; color: string }) {
  const d = Math.abs(delta) < 0.05 ? 0 : delta;
  const cls = Math.abs(d) < 0.05 ? "text-[#b5b2aa]" : d > 0 ? "text-emerald-700" : "text-rose-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${color}`}>
      {label} {value}g <span className={`text-[10px] font-medium ${cls}`}>{Math.abs(d) < 0.05 ? "±0" : `${d > 0 ? "+" : ""}${d}`}</span>
    </span>
  );
}

export function Step2V2() {
  const plan = useMealPlanStore((s) => s.plan());
  const removedKeys = useMealPlanStore((s) => s.removedKeys);
  const solutions = useMealPlanStore((s) => s.solutions);
  const solveMessage = useMealPlanStore((s) => s.solveMessage);
  const pickedSolutionIdx = useMealPlanStore((s) => s.pickedSolutionIdx);
  const pickSolution = useMealPlanStore((s) => s.pickSolution);
  const goStep1 = useMealPlanStore((s) => s.goStep1);

  const removedArr = [...removedKeys].map((k) => {
    const sep = k.indexOf("|");
    const mealLabel = k.slice(0, sep);
    const food = k.slice(sep + 1);
    const meal = plan.meals.find((m) => m.label === mealLabel);
    const it = meal?.items.find((i) => i.food === food);
    return it && meal ? { key: k, portion: it.portion, food: it.food, p: it.p, c: it.c, f: it.f, mealType: meal.mealType } : null;
  }).filter(Boolean) as Array<{ key: string; portion: string; food: string; p: number; c: number; f: number; mealType: import("@/types").MealTypeTag }>;

  return (
    <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-[18px] py-3">
          <div>
            <div className="text-[13px] font-semibold">Replacement options</div>
            <div className="mt-0.5 text-[12px] text-[#8a8780]">Auto-searched — tap Select to preview the full day</div>
          </div>
          <button type="button" className="btn-ghost py-1 text-[12px]" onClick={() => goStep1()}>
            ← Back
          </button>
        </div>

        {solveMessage && (
          <div className="border-b border-border bg-orange-50 px-[18px] py-2 text-[12px] text-orange-800">
            {solveMessage}
          </div>
        )}

        <div className="max-h-[560px] flex-1 overflow-y-auto">
          {solutions.length === 0 ? (
            <div className="px-6 py-11 text-center text-[#8a8780]">
              <div className="mb-2 text-[14px] font-medium text-[#1a1917]">No plans found</div>
              <div className="text-[13px] leading-relaxed">Try removing fewer items or adding more foods to the library.</div>
            </div>
          ) : (
            solutions.map((s, idx) => {
              const isPicked = pickedSolutionIdx === idx;
              return (
                <div
                  key={idx}
                  className={`border-b border-border px-[18px] py-3.5 transition-colors last:border-b-0 hover:bg-[#fafaf8] ${
                    isPicked ? "border-l-[3px] border-l-accent bg-[#e8f4ee]" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8780]">Option {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => pickSolution(idx)}
                      className="btn-primary py-1 text-[12px]"
                    >
                      Select this option
                    </button>
                  </div>

                  <div className="mb-2 space-y-1.5 text-[12px]">
                    {s.perRemoval.map(({ removedKey, replacement }, ri) => {
                      const sep = removedKey.indexOf("|");
                      const removedFood = removedKey.slice(sep + 1);
                      return (
                        <div key={`${removedKey}-${ri}`} className="font-medium text-food-primary">
                          Replace {removedFood} → {replacement.food}{" "}
                          <span className="text-food-primary">{replacement.portion}</span>{" "}
                          <span className="ml-1 inline-flex flex-wrap gap-0.5">
                            {replacement.mealTypes.map((mt) => (
                              <MealTypeTag key={mt} t={mt} />
                            ))}
                          </span>
                        </div>
                      );
                    })}
                    {s.aux.map((a) => (
                      <div key={`${a.food}-${a.portion}`} className="font-medium text-food-aux">
                        Auto-fill: {a.food}{" "}
                        <span className="text-food-aux">{a.portion}</span>{" "}
                        <span className="ml-1 inline-flex flex-wrap gap-0.5">
                          {a.mealTypes.map((mt) => (
                            <MealTypeTag key={mt} t={mt} />
                          ))}
                        </span>
                        {a.mergeHint && <span className="ml-1 text-[10px] italic text-food-aux-note">{a.mergeHint}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <MacroPill label="P" value={s.totals.p} delta={s.deltas.p} color="bg-sky-50 text-sky-800" />
                    <MacroPill label="C" value={s.totals.c} delta={s.deltas.c} color="bg-emerald-50 text-emerald-800" />
                    <MacroPill label="F" value={s.totals.f} delta={s.deltas.f} color="bg-orange-50 text-orange-800" />
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 text-[12px] font-semibold">
                      {s.totals.kcal} kcal{" "}
                      <span
                        className={`text-[10px] font-medium ${
                          Math.abs(s.deltas.kcal) < 1 ? "text-[#b5b2aa]" : s.deltas.kcal > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {Math.abs(s.deltas.kcal) < 1 ? "±0" : `${s.deltas.kcal > 0 ? "+" : ""}${s.deltas.kcal}`}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </section>

      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="border-b border-border px-[18px] py-3">
          <div className="text-[13px] font-semibold">Removed</div>
          <div className="mt-0.5 text-[12px] text-[#8a8780]">Foods you marked for replacement</div>
        </div>
        <div className="max-h-[560px] flex-1 overflow-y-auto">
          {removedArr.length === 0 ? (
            <div className="px-6 py-11 text-center text-[#8a8780]">
              <div className="mb-2 text-[14px] font-medium text-[#1a1917]">Nothing removed</div>
            </div>
          ) : (
            <>
              <div className="grid gap-1 border-b border-border px-[18px] py-1 text-[10px] font-semibold uppercase tracking-wide text-[#b5b2aa]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
                <span className="text-left">Portion</span>
                <span>Food</span>
                <span className="text-right">P</span>
                <span className="text-right">C</span>
                <span className="text-right">F</span>
              </div>
              {removedArr.map((i) => (
                <div key={i.key} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
                  <span className="text-[#8a8780]">{i.portion}</span>
                  <span className="font-medium text-food-removed line-through">
                    {i.food} <MealTypeTag t={i.mealType} />
                  </span>
                  <span className="text-right text-[#8a8780]">{i.p}</span>
                  <span className="text-right text-[#8a8780]">{i.c}</span>
                  <span className="text-right text-[#8a8780]">{i.f}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
