import { useMealPlanStore } from "@/store/mealPlanStore";
import type { AppStep } from "@/types";

const STEPS: { n: AppStep; title: string; sub: string }[] = [
  { n: 1, title: "Remove foods", sub: "Choose items to replace" },
  { n: 2, title: "Pick a plan", sub: "Auto-searched options" },
  { n: 3, title: "Confirm meal plan", sub: "Review vs default" },
];

export function StepBar() {
  const step = useMealPlanStore((s) => s.step);
  const setStep = useMealPlanStore((s) => s.setStep);

  return (
    <nav className="flex items-stretch overflow-x-auto border-b border-border bg-white px-6">
      {STEPS.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex items-center">
            {i > 0 && <span className="self-center px-1 text-[#d0ccc2]">›</span>}
            <button
              type="button"
              disabled={!done}
              onClick={() => {
                if (done) setStep(s.n);
              }}
              className={`flex items-center gap-2.5 whitespace-nowrap py-3 pr-4 transition-opacity ${
                active ? "opacity-100" : done ? "cursor-pointer opacity-60 hover:opacity-85" : "opacity-38"
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold ${
                  active || done ? "border-ui bg-ui text-white" : "border-[#d0ccc2] text-[#8a8780]"
                }`}
              >
                {done ? "✓" : s.n}
              </span>
              <span className="text-left">
                <div className="text-[13px] font-medium">{s.title}</div>
                <div className="mt-px text-[11px] text-[#8a8780]">{s.sub}</div>
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
