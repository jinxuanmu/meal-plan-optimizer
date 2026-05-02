import { kcalFromMacros, r, r0 } from "@/lib/mealMath";
import type { Macros } from "@/types";

type Props = {
  p: number;
  c: number;
  f: number;
  kcal?: number;
  /** vs default — when set, show delta row */
  vsDefault?: Macros & { kcal: number };
};

export function MacroBar({ p, c, f, kcal: kcalProp, vsDefault }: Props) {
  const kcal = kcalProp ?? kcalFromMacros({ p, c, f });
  const hasDelta = !!vsDefault;
  const dk = hasDelta ? r0(kcal - vsDefault.kcal) : 0;
  const pos = "text-emerald-700";
  const neg = "text-rose-700";
  const zero = "text-[#b5b2aa]";

  return (
    <div className="flex border-b border-border bg-bg px-4 py-2.5">
      <div className="mr-3 flex flex-1 flex-col gap-0.5 border-r border-border pr-3">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#8a8780]">Protein</div>
        <div className="text-[17px] font-semibold text-sky-700">{p}g</div>
        {hasDelta && (
          <div className={`text-[11px] font-medium ${p - vsDefault.p > 0 ? pos : p - vsDefault.p < 0 ? neg : zero}`}>
            {p - vsDefault.p >= 0 ? "+" : ""}
            {r(p - vsDefault.p)}g vs default
          </div>
        )}
      </div>
      <div className="mr-3 flex flex-1 flex-col gap-0.5 border-r border-border pr-3">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#8a8780]">Carbs</div>
        <div className="text-[17px] font-semibold text-emerald-700">{c}g</div>
        {hasDelta && (
          <div className={`text-[11px] font-medium ${c - vsDefault.c > 0 ? pos : c - vsDefault.c < 0 ? neg : zero}`}>
            {c - vsDefault.c >= 0 ? "+" : ""}
            {r(c - vsDefault.c)}g vs default
          </div>
        )}
      </div>
      <div className="mr-3 flex flex-1 flex-col gap-0.5 border-r border-border pr-3">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#8a8780]">Fat</div>
        <div className="text-[17px] font-semibold text-orange-700">{f}g</div>
        {hasDelta && (
          <div className={`text-[11px] font-medium ${f - vsDefault.f > 0 ? pos : f - vsDefault.f < 0 ? neg : zero}`}>
            {f - vsDefault.f >= 0 ? "+" : ""}
            {r(f - vsDefault.f)}g vs default
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#8a8780]">Calories</div>
        <div className="text-[15px] font-semibold text-[#1a1917]">
          {kcal} kcal
        </div>
        {hasDelta && (
          <div className={`text-[11px] font-medium ${dk > 0 ? pos : dk < 0 ? neg : zero}`}>
            {dk >= 0 ? "+" : ""}
            {dk} vs default
          </div>
        )}
      </div>
    </div>
  );
}
