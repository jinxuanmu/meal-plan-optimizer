import type { ReactNode } from "react";
import { MacroBar } from "@/components/MacroBar";
import { MealTypeTag } from "@/components/MealTypeTag";
import { calcFixed, getRemovedMealTypes, itemKey, parseItemKey } from "@/lib/planQueries";
import { useMealPlanStore } from "@/store/mealPlanStore";
import type { AutofillLine, DayPlan, MealTypeTag as MealKind, PlanItem, PrimaryLine } from "@/types";
import { r } from "@/lib/mealMath";

type ExtraAgg = PrimaryLine | AutofillLine;
type LibMeal = Exclude<MealKind, "oil">;
/** Countable autofill branch (some TS versions narrow `Extract` on Omit to never). */
type CountableLine = Extract<AutofillLine, { type: 2 }>;

/** Insert new rows under a meal that had removals; else first meal matching the line’s meal types. */
function mealLabelForInsertedLine(plan: DayPlan, removedMealTypes: Set<LibMeal>, line: { mealTypes: LibMeal[] }): string {
  for (const meal of plan.meals) {
    if (meal.mealType === "oil") continue;
    const mt = meal.mealType as LibMeal;
    if (removedMealTypes.has(mt) && line.mealTypes.includes(mt)) return meal.label;
  }
  for (const meal of plan.meals) {
    if (meal.mealType === "oil") continue;
    const mt = meal.mealType as LibMeal;
    if (line.mealTypes.includes(mt)) return meal.label;
  }
  const fallback = plan.meals.find((m) => m.mealType !== "oil");
  return fallback?.label ?? plan.meals[0]?.label ?? "";
}

/** Inline state pill on the left plan (matches tailwind food-* tokens). */
function RowStateTag({ variant, children }: { variant: "replace" | "fill" | "mergeUp" | "mergeDown"; children: ReactNode }) {
  const cls =
    variant === "replace"
      ? "bg-[#1a5fa8]"
      : variant === "fill"
        ? "bg-[#2d6a4f]"
        : variant === "mergeUp"
          ? "bg-[#92560a]"
          : "bg-[#6a3b9b]";
  return (
    <span className={`ml-1.5 inline-block align-middle rounded px-1 py-px text-[9px] font-semibold leading-tight text-white ${cls}`}>{children}</span>
  );
}

function mergeExtras(primaries: PrimaryLine[], aux: AutofillLine[]) {
  const extras: Record<string, ExtraAgg & { oz?: number; count?: number }> = {};

  const add = (f: PrimaryLine | AutofillLine) => {
    if (!f.food) return;
    const cur = extras[f.food];
    if (cur) {
      cur.p = r(cur.p + f.p);
      cur.c = r(cur.c + f.c);
      cur.f = r(cur.f + f.f);
      if (f.type === 1 && "oz" in f && f.oz != null) {
        cur.oz = r((cur.oz ?? 0) + f.oz);
      } else if (f.type === 2 && "count" in f) {
        cur.count = (cur.count ?? 0) + f.count;
      }
    } else {
      extras[f.food] = { ...(f as any) };
    }
  };

  primaries.forEach(add);
  aux.forEach(add);
  return extras;
}

export function Step3V2() {
  const plan = useMealPlanStore((s) => s.plan());
  const removedKeys = useMealPlanStore((s) => s.removedKeys);
  const solutions = useMealPlanStore((s) => s.solutions);
  const pickedSolutionIdx = useMealPlanStore((s) => s.pickedSolutionIdx);
  const goStep2 = useMealPlanStore((s) => s.goStep2);
  const resetFlow = useMealPlanStore((s) => s.resetFlow);

  if (pickedSolutionIdx == null) return null;
  const picked = solutions[pickedSolutionIdx];
  if (!picked) return null;

  const t = plan.target;
  calcFixed(plan, removedKeys);
  const extras = mergeExtras(
    picked.perRemoval.map((x) => x.replacement),
    picked.aux,
  );
  const mergeShown = new Set<string>();
  plan.meals.forEach((meal) => {
    meal.items.forEach((item) => {
      const key = itemKey(meal.label, item.food);
      if (removedKeys.has(key)) return;
      if (extras[item.food]) mergeShown.add(item.food);
    });
  });

  const colHd = (
    <div className="grid gap-1 border-b border-border px-[18px] py-1 text-[10px] font-semibold uppercase tracking-wide text-[#b5b2aa]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
      <span className="text-left">Portion</span>
      <span>Food</span>
      <span className="text-right">P</span>
      <span className="text-right">C</span>
      <span className="text-right">F</span>
    </div>
  );

  function bumpLeadingNumber(portion: string, newLeading: number): string {
    return portion.replace(/^(\d+)(\.\d+)?/, String(newLeading));
  }

  function mergeMeta(item: PlanItem, ex: ExtraAgg & { oz?: number; count?: number }) {
    // v2 mostly increases; UI still supports decreases (purple).
    if (item.type === 1 && ex.type === 1 && item.oz != null && (ex as any).oz != null) {
      const dOz = r((ex as any).oz);
      if (Math.abs(dOz) < 0.001) return null;
      const up = dOz > 0;
      return {
        dir: up ? ("up" as const) : ("down" as const),
        icon: up ? "↑" : "↓",
        dText: up ? `+${Math.abs(dOz)}oz` : `-${Math.abs(dOz)}oz`,
        defText: up
          ? `Default ${item.oz}oz, +${Math.abs(dOz)}oz added`
          : `Default ${item.oz}oz, -${Math.abs(dOz)}oz`,
      };
    }
    if (item.type === 2 && ex.type === 2 && item.perUnit) {
      const ex2 = ex as CountableLine;
      const defCnt = Math.max(1, Math.round(item.p / item.perUnit.p));
      const addCnt = Math.max(0, Math.round(ex2.count ?? ex.p / ex2.perUnit.p));
      if (addCnt === 0) return { dir: "up" as const, icon: "↑", defText: "Merged" };
      const up = addCnt > 0;
      const tail = item.portion.replace(/^(\d+)(\.\d+)?\s*/, "").trim(); // e.g. "1 whole" -> "whole"
      const defQty = item.portion.match(/^(\d+)(\.\d+)?/)?.[0] ?? String(defCnt);
      return {
        dir: up ? ("up" as const) : ("down" as const),
        icon: up ? "↑" : "↓",
        defText: up
          ? `Default ${defQty} ${tail}, +${Math.abs(addCnt)} ${tail} added`
          : `Default ${defQty} ${tail}, -${Math.abs(addCnt)} ${tail}`,
      };
    }
    return { dir: "up" as const, icon: "↑", dText: "Merged", defText: "Merged" };
  }

  /** Right-panel portion change summary; null if not quantifiable. */
  function mergePortionSummary(item: PlanItem, ex: ExtraAgg & { oz?: number; count?: number }): { dir: "up" | "down"; text: string } | null {
    if (item.type === 1 && ex.type === 1 && item.oz != null && (ex as any).oz != null) {
      const dOz = r((ex as any).oz);
      if (Math.abs(dOz) < 0.001) return null;
      const now = r(item.oz + dOz);
      return { dir: dOz > 0 ? "up" : "down", text: `${item.food}: default ${item.oz}oz → now ${now}oz` };
    }
    if (item.type === 2 && ex.type === 2 && item.perUnit) {
      const ex2 = ex as CountableLine;
      const defCnt = Math.max(1, Math.round(item.p / item.perUnit.p));
      const addCnt = Math.round(ex2.count ?? ex.p / ex2.perUnit.p);
      if (addCnt === 0) return null;
      const totalCnt = Math.max(1, defCnt + addCnt);
      const nowPortion = bumpLeadingNumber(item.portion, totalCnt);
      return { dir: addCnt > 0 ? "up" : "down", text: `${item.food}: default ${item.portion} → now ${nowPortion}` };
    }
    return null;
  }

  /** Left merged row: small tag (↑ +Xoz / ↓ -Xoz or countable unit). */
  function mergeDeltaTag(item: PlanItem, ex: ExtraAgg & { oz?: number; count?: number }): { variant: "mergeUp" | "mergeDown"; label: string } | null {
    if (item.type === 1 && ex.type === 1 && item.oz != null && (ex as any).oz != null) {
      const dOz = r((ex as any).oz);
      if (Math.abs(dOz) < 0.001) return null;
      if (dOz > 0) return { variant: "mergeUp", label: `↑ +${dOz}oz` };
      return { variant: "mergeDown", label: `↓ -${Math.abs(dOz)}oz` };
    }
    if (item.type === 2 && ex.type === 2 && item.perUnit) {
      const ex2 = ex as CountableLine;
      const addCnt = Math.round(ex2.count ?? ex.p / ex2.perUnit.p);
      if (addCnt === 0) return null;
      const tail = item.portion.replace(/^(\d+)(\.\d+)?\s*/, "").trim();
      const unit = tail ? ` ${tail}` : " serving";
      if (addCnt > 0) return { variant: "mergeUp", label: `↑ +${addCnt}${unit}` };
      return { variant: "mergeDown", label: `↓ -${Math.abs(addCnt)}${unit}` };
    }
    return null;
  }

  function renderPlanRow(item: PlanItem, mealLabel: string) {
    const key = itemKey(mealLabel, item.food);
    if (removedKeys.has(key)) return null;
    const ex = extras[item.food];

    if (ex && mergeShown.has(item.food)) {
      const mP = r(item.p + ex.p);
      const mC = r(item.c + ex.c);
      const mF = r(item.f + ex.f);
      const meta = mergeMeta(item, ex as any);
      const up = !meta || meta.dir !== "down";
      const foodColor = up ? "text-food-merge-up" : "text-food-merge-down";
      const noteColor = up ? "text-food-merge-up-note" : "text-food-merge-down-note";
      const deltaTag = mergeDeltaTag(item, ex as ExtraAgg & { oz?: number; count?: number });
      const showFallbackNote = !deltaTag && Boolean(meta?.defText);

      if (item.type === 1 && ex.type === 1 && item.oz != null && (ex as any).oz != null) {
        const newOz = r(item.oz + (ex as any).oz);
        return (
          <div key={key} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
            <span className={`font-medium ${foodColor}`}>{newOz}oz</span>
            <span className={`font-medium ${foodColor}`}>
              {item.food}
              {deltaTag ? (
                <RowStateTag variant={deltaTag.variant}>{deltaTag.label}</RowStateTag>
              ) : (
                <>
                  {meta?.icon ? <span className="mr-1">{meta.icon}</span> : null}
                  {showFallbackNote ? <span className={`text-[10px] italic ${noteColor}`}> {meta?.defText}</span> : null}
                </>
              )}
            </span>
            <span className="text-right text-[#8a8780]">{mP}</span>
            <span className="text-right text-[#8a8780]">{mC}</span>
            <span className="text-right text-[#8a8780]">{mF}</span>
          </div>
        );
      }

      if (item.type === 2 && ex.type === 2 && item.perUnit) {
        const ex2 = ex as CountableLine;
        const defCnt = Math.max(1, Math.round(item.p / item.perUnit.p));
        const addCnt = Math.max(0, Math.round(ex2.count ?? ex.p / ex2.perUnit.p));
        const totalCnt = defCnt + addCnt;
        const mergedPortion = bumpLeadingNumber(item.portion, totalCnt);
        return (
          <div key={key} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
            <span className={`font-medium ${foodColor}`}>{mergedPortion}</span>
            <span className={`font-medium ${foodColor}`}>
              {item.food}
              {deltaTag ? (
                <RowStateTag variant={deltaTag.variant}>{deltaTag.label}</RowStateTag>
              ) : (
                <>
                  {meta?.icon ? <span className="mr-1">{meta.icon}</span> : null}
                  {showFallbackNote ? <span className={`text-[10px] italic ${noteColor}`}> {meta?.defText}</span> : null}
                </>
              )}
            </span>
            <span className="text-right text-[#8a8780]">{mP}</span>
            <span className="text-right text-[#8a8780]">{mC}</span>
            <span className="text-right text-[#8a8780]">{mF}</span>
          </div>
        );
      }

      return (
        <div key={key} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
          <span className="text-[#8a8780]">{item.portion}</span>
          <span className={`font-medium ${foodColor}`}>
            {item.food}
            {deltaTag ? (
              <RowStateTag variant={deltaTag.variant}>{deltaTag.label}</RowStateTag>
            ) : (
              <>
                {meta?.icon ? <span className="mr-1">{meta.icon}</span> : null}
                {showFallbackNote ? <span className={`text-[10px] italic ${noteColor}`}> {meta?.defText}</span> : null}
              </>
            )}
          </span>
          <span className="text-right text-[#8a8780]">{mP}</span>
          <span className="text-right text-[#8a8780]">{mC}</span>
          <span className="text-right text-[#8a8780]">{mF}</span>
        </div>
      );
    }

    return (
      <div key={key} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
        <span className="text-[#8a8780]">{item.portion}</span>
        <span className="text-[#1a1917]">{item.food}</span>
        <span className="text-right text-[#8a8780]">{item.p}</span>
        <span className="text-right text-[#8a8780]">{item.c}</span>
        <span className="text-right text-[#8a8780]">{item.f}</span>
      </div>
    );
  }

  const newAux = picked.aux.filter((a) => !mergeShown.has(a.food));

  const removedMealTypes = getRemovedMealTypes(plan, removedKeys);
  const insertedByMeal = new Map<string, { kind: "p" | "a"; line: PrimaryLine | AutofillLine }[]>();
  const pushInserted = (kind: "p" | "a", line: PrimaryLine | AutofillLine, mealLabel: string) => {
    if (!mealLabel) return;
    const arr = insertedByMeal.get(mealLabel) ?? [];
    arr.push({ kind, line });
    insertedByMeal.set(mealLabel, arr);
  };
  for (const { removedKey, replacement } of picked.perRemoval) {
    if (mergeShown.has(replacement.food)) continue;
    const { mealLabel } = parseItemKey(removedKey);
    pushInserted("p", replacement, mealLabel);
  }
  for (const a of newAux) {
    const lab = mealLabelForInsertedLine(plan, removedMealTypes, a);
    pushInserted("a", a, lab);
  }
  for (const arr of insertedByMeal.values()) {
    arr.sort((x, y) => (x.kind === "p" ? 0 : 1) - (y.kind === "p" ? 0 : 1));
  }

  const mergeUpRows: ReactNode[] = [];
  const mergeDownRows: ReactNode[] = [];
  for (const meal of plan.meals) {
    for (const item of meal.items) {
      const key = itemKey(meal.label, item.food);
      if (removedKeys.has(key)) continue;
      if (!mergeShown.has(item.food)) continue;
      const ex = extras[item.food];
      if (!ex) continue;
      const sum = mergePortionSummary(item, ex as ExtraAgg & { oz?: number; count?: number });
      if (!sum) continue;
      const row = (
        <div key={key} className={`py-0.5 text-[13px] ${sum.dir === "up" ? "text-[#92560a]" : "text-[#6a3b9b]"}`}>
          {sum.text}
        </div>
      );
      if (sum.dir === "up") mergeUpRows.push(row);
      else mergeDownRows.push(row);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="border-b border-border px-[18px] py-3">
          <div className="text-[13px] font-semibold">Full meal plan</div>
          <div className="mt-0.5 text-[12px] text-[#8a8780]">{plan.label}</div>
        </div>
        <MacroBar p={picked.totals.p} c={picked.totals.c} f={picked.totals.f} kcal={picked.totals.kcal} vsDefault={{ p: t.p, c: t.c, f: t.f, kcal: t.kcal }} />
        <div className="max-h-[560px] flex-1 overflow-y-auto">
          {plan.meals.map((meal) => {
            const inserted = insertedByMeal.get(meal.label) ?? [];
            return (
              <div key={meal.label}>
                <div className="border-b border-border bg-bg px-[18px] py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a8780]">{meal.label}</div>
                {colHd}
                {meal.items.map((item) => renderPlanRow(item, meal.label))}
                {inserted.map(({ kind, line }, idx) => {
                  const color = kind === "p" ? "text-food-primary" : "text-food-aux";
                  const rowKey = `ins-${meal.label}-${kind}-${line.food}-${idx}`;
                  return (
                    <div key={rowKey} className="grid items-center gap-1 border-b border-border px-[18px] py-1.5 text-[12px]" style={{ gridTemplateColumns: "80px 1fr 36px 36px 36px" }}>
                      <span className={`font-medium ${color}`}>{line.portion}</span>
                      <span className={`font-medium ${color}`}>
                        {line.food}
                        <RowStateTag variant={kind === "p" ? "replace" : "fill"}>{kind === "p" ? "Replace" : "Fill"}</RowStateTag>{" "}
                        {line.mealTypes.map((mt) => (
                          <MealTypeTag key={mt} t={mt} />
                        ))}
                      </span>
                      <span className="text-right text-[#8a8780]">{line.p}</span>
                      <span className="text-right text-[#8a8780]">{line.c}</span>
                      <span className="text-right text-[#8a8780]">{line.f}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border bg-bg px-[18px] py-3">
          <button type="button" className="btn-ghost" onClick={() => goStep2()}>
            ← Pick another option
          </button>
          <button type="button" className="btn-ghost" onClick={() => resetFlow()}>
            Start over
          </button>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow">
        <div className="border-b border-border px-[18px] py-3">
          <div className="text-[13px] font-semibold">Compare to default</div>
        </div>
        <div className="max-h-[560px] flex-1 overflow-y-auto">
          {picked.perRemoval.length > 0 && (
            <div className="border-b border-border px-[18px] py-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8780]">Removed → Replaced with</div>
              {picked.perRemoval.flatMap(({ removedKey, replacement }) => {
                const { mealLabel, food } = parseItemKey(removedKey);
                const meal = plan.meals.find((m) => m.label === mealLabel);
                const rmMt = meal?.mealType;
                const it = meal?.items.find((i) => i.food === food);
                if (!it || !rmMt) return [];
                return [
                  <div key={removedKey} className="flex flex-wrap items-baseline gap-x-1 gap-y-1 py-0.5 text-[13px] leading-snug">
                    <span className="inline-flex flex-wrap items-center gap-0.5 align-middle">
                      <MealTypeTag t={rmMt} />
                      <span className="text-food-removed line-through decoration-food-removed">{it.food}</span>
                    </span>
                    <span className="shrink-0 text-[#8a8780]">→</span>
                    <span className="inline-flex min-w-0 flex-wrap items-center gap-0.5 align-middle font-medium text-[#1a5fa8]">
                      {replacement.mealTypes.map((mt) => (
                        <MealTypeTag key={mt} t={mt} />
                      ))}
                      <span>{replacement.food}</span>
                      <span>{replacement.portion}</span>
                    </span>
                  </div>,
                ];
              })}
            </div>
          )}
          {newAux.length > 0 && (
            <div className="border-b border-border px-[18px] py-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8780]">Auto-filled</div>
              {newAux.map((f) => (
                <div key={`sum-a-${f.food}-${f.portion}`} className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 py-0.5 text-[13px] font-medium text-[#2d6a4f]">
                  {f.mealTypes.map((mt) => (
                    <MealTypeTag key={mt} t={mt} />
                  ))}
                  <span>{f.food}</span>
                  <span>{f.portion}</span>
                </div>
              ))}
            </div>
          )}
          {mergeUpRows.length > 0 && (
            <div className="border-b border-border px-[18px] py-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#92560a]">Increased portion ↑</div>
              {mergeUpRows}
            </div>
          )}
          {mergeDownRows.length > 0 && (
            <div className="border-b border-border px-[18px] py-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6a3b9b]">Reduced portion ↓</div>
              {mergeDownRows}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

